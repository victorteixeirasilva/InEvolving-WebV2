"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as Switch from "@radix-ui/react-switch";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  EnvelopeIcon,
  KeyIcon,
  TrashIcon,
  UserCircleIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ForgotPasswordModal } from "@/components/features/auth/ForgotPasswordModal";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { DevSectionNotice } from "@/components/ui/DevSectionNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import {
  defaultNextRenewalDate,
  loadAmigos,
  loadAjustesProfile,
  loadRenewalDate,
  saveAmigos,
  saveAjustesProfile,
  saveRenewalDate,
  type Amigo,
  type AjustesProfile,
} from "@/lib/ajustes-storage";
import {
  getMissingUserProfileFieldLabels,
  notifyUserProfileIncompleteIfNeeded,
} from "@/lib/ajustes-user-profile-notify";
import { appToast } from "@/lib/app-toast";
import { STORAGE_KEYS, buildWhatsAppMessageUrl } from "@/lib/constants";
import { fetchUserProfile } from "@/lib/user/fetch-user-profile";
import { userProfileApiToAjustesProfile } from "@/lib/user/map-user-profile-api";
import { patchUserEmail } from "@/lib/user/patch-user-email";
import { patchUserProfile, type PatchUserProfileBody } from "@/lib/user/patch-user-profile";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

function readLoginEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(STORAGE_KEYS.email) ?? "").trim();
  } catch {
    return "";
  }
}

function readJwt(): string {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
  } catch {
    return "";
  }
}

const ease = [0.16, 1, 0.3, 1] as const;

export function AjustesClient() {
  const router = useRouter();
  const authRedirect401Ref = useRef(false);
  const handleUnauthorized = useCallback(() => {
    if (!authRedirect401Ref.current) {
      authRedirect401Ref.current = true;
      router.push("/login");
      appToast.error("Sessão expirada. Faça login novamente.");
    }
  }, [router]);

  const { mode, toggle } = useThemeStore();
  const [profile, setProfile] = useState<AjustesProfile>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    profilePictureUrl: "",
    profilePhotoDataUrl: "",
    birthDate: "",
    billingAddress: "",
  });
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false);
  const [confirmEmailText, setConfirmEmailText] = useState("");
  const hydrated = useRef(false);
  const baselineEmailRef = useRef("");
  const pendingProfileRef = useRef<AjustesProfile | null>(null);

  useLayoutEffect(() => {
    const p = loadAjustesProfile();
    const loginMail = readLoginEmail();
    if (!p.email && loginMail) {
      p.email = loginMail;
      saveAjustesProfile(p);
    }
    setProfile(p);
    baselineEmailRef.current = p.email.trim();

    let r = loadRenewalDate();
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEYS.ajustesRenewal)) {
      r = defaultNextRenewalDate();
      saveRenewalDate(r);
    }
    setRenewalDate(r);

    setAmigos(loadAmigos());
    hydrated.current = true;

    queueMicrotask(() => {
      if (!readJwt()) {
        notifyUserProfileIncompleteIfNeeded(p);
      }
    });
  }, []);

  useEffect(() => {
    const jwt = readJwt();
    if (!jwt) return;

    let cancelled = false;
    void (async () => {
      const localBefore = loadAjustesProfile();
      const r = await fetchUserProfile(jwt);
      if (cancelled) return;

      if (r.kind === "unauthorized") {
        handleUnauthorized();
        return;
      }
      if (r.kind === "network_error") {
        appToast.error("Não foi possível carregar o perfil. Verifique sua conexão.");
        return;
      }
      if (r.kind !== "ok") {
        return;
      }

      const next = userProfileApiToAjustesProfile(r.data, localBefore);
      saveAjustesProfile(next);
      setProfile(next);
      baselineEmailRef.current = next.email.trim();

      const re = r.data.dataDaProximaRenovacao?.trim() ?? "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(re)) {
        saveRenewalDate(re);
        setRenewalDate(re);
      }

      queueMicrotask(() => notifyUserProfileIncompleteIfNeeded(next));
    })();

    return () => {
      cancelled = true;
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveAmigos(amigos);
  }, [amigos]);

  const forgotInitialEmail = profile.email.trim() || readLoginEmail();

  const handleCpfChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 11);
    const masked = digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setProfile((p) => ({ ...p, cpf: masked }));
  };

  const handleProfilePhotoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMsg("Selecione uma imagem válida para foto de perfil.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = String(reader.result ?? "");
      setProfile((p) => ({ ...p, profilePhotoDataUrl: next }));
      setProfileMsg(null);
    };
    reader.onerror = () => {
      setProfileMsg("Não foi possível carregar a foto de perfil.");
    };
    reader.readAsDataURL(file);
  };

  const persistProfileRemote = useCallback(
    async (next: AjustesProfile) => {
      const jwt = readJwt();
      if (!jwt) return;

      setProfileSaving(true);
      try {
        const phoneDigits = next.phone.replace(/\D/g, "");
        const cpfDigits = next.cpf.replace(/\D/g, "");
        const pic = next.profilePictureUrl.trim();
        const picHttp = /^https?:\/\//i.test(pic) ? pic : undefined;

        const body: PatchUserProfileBody = {
          fullName: next.name.trim(),
          cpf: cpfDigits.length === 11 ? cpfDigits : null,
          dateOfBirth: next.birthDate.trim() || null,
          billingAddress: next.billingAddress.trim() || null,
          phoneNumber: phoneDigits.length >= 10 ? phoneDigits : null,
        };
        if (picHttp) body.profilePictureUrl = picHttp;

        const pr = await patchUserProfile(jwt, body);
        if (pr.kind === "unauthorized") {
          handleUnauthorized();
          return;
        }
        if (pr.kind === "validation_error") {
          setProfileMsg(pr.message);
          return;
        }
        if (pr.kind === "network_error") {
          appToast.error("Falha de conexão. Verifique sua internet.");
          return;
        }
        if (pr.kind !== "ok") {
          setProfileMsg(pr.message ?? "Não foi possível atualizar o perfil.");
          return;
        }

        const baselineNorm = baselineEmailRef.current.trim().toLowerCase();
        const newNorm = next.email.trim().toLowerCase();
        const emailChanged = newNorm !== baselineNorm;

        let toastMsg = pr.message ?? "Perfil atualizado com sucesso!";

        if (emailChanged) {
          const er = await patchUserEmail(jwt, next.email.trim());
          if (er.kind === "unauthorized") {
            handleUnauthorized();
            return;
          }
          if (er.kind === "network_error") {
            appToast.error("Falha de conexão ao solicitar troca de e-mail.");
            return;
          }
          if (er.kind === "validation_error") {
            setProfileMsg(er.message);
            return;
          }
          if (er.kind === "email_in_use") {
            setProfileMsg(er.message);
            appToast.error(er.message);
            const reverted: AjustesProfile = { ...next, email: baselineEmailRef.current };
            setProfile(reverted);
            saveAjustesProfile(reverted);
            return;
          }
          if (er.kind === "http_error") {
            setProfileMsg(er.message ?? "Erro ao atualizar o e-mail.");
            return;
          }
          if (er.kind === "same_email") {
            toastMsg = er.message;
            appToast.show(toastMsg);
          } else {
            toastMsg = er.message;
            appToast.success(toastMsg);
            try {
              localStorage.setItem(STORAGE_KEYS.email, next.email.trim());
            } catch {
              /* ignore */
            }
            baselineEmailRef.current = next.email.trim();
          }
        } else if (pr.message) {
          appToast.success(pr.message);
        } else {
          appToast.success(toastMsg);
        }

        setProfile(next);
        saveAjustesProfile(next);
        baselineEmailRef.current = next.email.trim();
        setPwd("");
        setPwd2("");
        setProfileMsg("Perfil sincronizado com o servidor.");
        queueMicrotask(() => notifyUserProfileIncompleteIfNeeded(next));
      } finally {
        setProfileSaving(false);
      }
    },
    [handleUnauthorized]
  );

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const nameTrim = profile.name.trim();
    if (!nameTrim) {
      setProfileMsg("Informe seu nome.");
      return;
    }
    if (nameTrim.length < 3 || nameTrim.length > 100) {
      setProfileMsg("Nome deve ter entre 3 e 100 caracteres.");
      return;
    }
    if (!profile.email.trim()) {
      setProfileMsg("Informe um e-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      setProfileMsg("E-mail inválido.");
      return;
    }
    const birth = profile.birthDate.trim();
    if (birth) {
      const d = new Date(`${birth}T12:00:00`);
      const endToday = new Date();
      endToday.setHours(23, 59, 59, 999);
      if (!(d.getTime() < endToday.getTime())) {
        setProfileMsg("Data de nascimento deve ser no passado.");
        return;
      }
    }
    const cpfDigits = profile.cpf.replace(/\D/g, "");
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      setProfileMsg("CPF inválido. Informe os 11 dígitos.");
      return;
    }
    const phoneDigits = profile.phone.replace(/\D/g, "");
    const jwt = readJwt();
    if (jwt && phoneDigits.length > 0 && phoneDigits.length < 10) {
      setProfileMsg("Telefone deve ter pelo menos 10 dígitos.");
      return;
    }
    if (pwd || pwd2) {
      if (pwd.length < 6) {
        setProfileMsg("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (pwd !== pwd2) {
        setProfileMsg("As senhas não coincidem.");
        return;
      }
    }
    const next: AjustesProfile = {
      name: nameTrim,
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      cpf: profile.cpf.trim(),
      profilePictureUrl: profile.profilePictureUrl.trim(),
      profilePhotoDataUrl: profile.profilePhotoDataUrl.trim(),
      birthDate: profile.birthDate.trim(),
      billingAddress: profile.billingAddress.trim(),
    };

    if (!jwt) {
      setProfile(next);
      saveAjustesProfile(next);
      baselineEmailRef.current = next.email.trim();
      setPwd("");
      setPwd2("");
      setProfileMsg(
        pwd
          ? "Perfil salvo localmente. A senha não é alterada aqui — use «Alterar senha». Faça login para sincronizar com o servidor."
          : "Perfil salvo neste dispositivo. Faça login para sincronizar com o servidor."
      );
      queueMicrotask(() => notifyUserProfileIncompleteIfNeeded(next));
      return;
    }

    const baseNorm = baselineEmailRef.current.trim().toLowerCase();
    const newNorm = next.email.trim().toLowerCase();
    if (newNorm !== baseNorm) {
      pendingProfileRef.current = next;
      setConfirmEmailText(next.email.trim());
      setEmailConfirmOpen(true);
      return;
    }

    await persistProfileRemote(next);
  };

  const confirmEmailChange = () => {
    const pending = pendingProfileRef.current;
    setEmailConfirmOpen(false);
    setConfirmEmailText("");
    pendingProfileRef.current = null;
    if (!pending) return;
    void persistProfileRemote(pending);
  };

  const cancelEmailChange = () => {
    setEmailConfirmOpen(false);
    setConfirmEmailText("");
    pendingProfileRef.current = null;
  };

  const sendInvite = useCallback(() => {
    setInviteMsg(null);
    const em = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setInviteMsg("Digite um e-mail válido.");
      return;
    }
    if (amigos.some((a) => a.email === em)) {
      setInviteMsg("Este e-mail já está na lista.");
      return;
    }
    const nextId = amigos.length === 0 ? 1 : Math.max(...amigos.map((a) => a.id)) + 1;
    setAmigos((prev) => [...prev, { id: nextId, email: em }]);
    setInviteEmail("");
    setInviteMsg("Convite registrado (simulação). Em produção o amigo receberá o convite por e-mail.");
  }, [amigos, inviteEmail]);

  const removeAmigo = (id: number) => {
    setAmigos((prev) => prev.filter((a) => a.id !== id));
  };

  const renewalDisplay =
    renewalDate && /^\d{4}-\d{2}-\d{2}$/.test(renewalDate)
      ? new Date(renewalDate + "T12:00:00").toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  const openCancelRenewalWhatsApp = () => {
    const msg =
      "Olá! Gostaria de cancelar a renovação automática do meu plano InEvolving. Pode me orientar sobre os próximos passos?";
    window.open(buildWhatsAppMessageUrl(msg), "_blank", "noopener,noreferrer");
  };

  const missingProfileLabels = useMemo(() => getMissingUserProfileFieldLabels(profile), [profile]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <GlassCard className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label.Root className="text-sm font-medium text-[var(--text-primary)]">Tema escuro</Label.Root>
            {/* <p className="text-xs text-[var(--text-muted)]">Persistido como tema 1/2 no localStorage (legado).</p> */}
          </div>
          <Switch.Root
            checked={mode === "dark"}
            onCheckedChange={() => toggle()}
            className="h-8 w-14 shrink-0 rounded-full bg-[var(--glass-border)] outline-none transition-colors duration-[380ms] data-[state=checked]:bg-brand-cyan/80"
          >
            <Switch.Thumb className="block h-7 w-7 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-[380ms] data-[state=checked]:translate-x-6" />
          </Switch.Root>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-6 w-6 text-brand-cyan" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Informações do usuário</h2>
        </div>
        {(profile.emailVerified !== undefined ||
          Boolean(profile.lastLogin?.trim()) ||
          profile.isActive !== undefined) && (
          <div className="rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_55%,transparent)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-muted)]">
            {profile.emailVerified !== undefined && (
              <p>
                <span className="font-semibold text-[var(--text-primary)]">E-mail verificado:</span>{" "}
                {profile.emailVerified ? "Sim" : "Não"}
              </p>
            )}
            {profile.lastLogin?.trim() && (
              <p className="mt-1">
                <span className="font-semibold text-[var(--text-primary)]">Último acesso:</span>{" "}
                {/^\d{4}-\d{2}-\d{2}$/.test(profile.lastLogin.trim())
                  ? new Date(`${profile.lastLogin.trim()}T12:00:00`).toLocaleDateString("pt-BR")
                  : profile.lastLogin.trim()}
              </p>
            )}
            {profile.isActive !== undefined && (
              <p className="mt-1">
                <span className="font-semibold text-[var(--text-primary)]">Conta ativa:</span>{" "}
                {profile.isActive ? "Sim" : "Não"}
              </p>
            )}
          </div>
        )}
        {missingProfileLabels.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-amber-500/45 bg-amber-500/10 px-3 py-2.5 text-sm leading-snug text-[var(--text-primary)]"
          >
            <span className="font-semibold text-amber-200 dark:text-amber-100">Perfil incompleto.</span>{" "}
            <span className="text-[var(--text-muted)]">
              Preencha: <span className="font-medium text-[var(--text-primary)]">{missingProfileLabels.join(", ")}</span>.
              A foto de perfil é opcional.
            </span>
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="ajuste-nome" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              Nome
            </label>
            <Input
              id="ajuste-nome"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              autoComplete="name"
              className="py-2.5"
            />
          </div>
          <div>
            <label htmlFor="ajuste-email" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              E-mail
            </label>
            <Input
              id="ajuste-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              autoComplete="email"
              className="py-2.5"
            />
          </div>
          <div>
            <label htmlFor="ajuste-foto" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              Foto de perfil
            </label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                {profile.profilePictureUrl || profile.profilePhotoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profilePictureUrl || profile.profilePhotoDataUrl}
                    alt="Prévia da foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[var(--text-muted)]">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Input
                  id="ajuste-foto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProfilePhotoFile(e.target.files?.[0] ?? null)}
                  className="py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-cyan/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-cyan"
                />
                {(profile.profilePhotoDataUrl || profile.profilePictureUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-fit"
                    onClick={() =>
                      setProfile((p) => ({ ...p, profilePhotoDataUrl: "", profilePictureUrl: "" }))
                    }
                  >
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="ajuste-cpf" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              CPF
            </label>
            <Input
              id="ajuste-cpf"
              value={profile.cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              autoComplete="off"
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="py-2.5"
            />
          </div>
          <div>
            <label htmlFor="ajuste-birth-date" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              Data de nascimento
            </label>
            <DateField
              id="ajuste-birth-date"
              value={profile.birthDate}
              onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))}
              className="py-2.5"
            />
          </div>
          <div>
            <label htmlFor="ajuste-billing-address" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              Endereço de faturamento
            </label>
            <textarea
              id="ajuste-billing-address"
              rows={3}
              value={profile.billingAddress}
              onChange={(e) => setProfile((p) => ({ ...p, billingAddress: e.target.value }))}
              placeholder="Rua, número, complemento, bairro, cidade, UF e CEP"
              className={cn(
                "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
                "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none"
              )}
            />
          </div>
          <div>
            <label htmlFor="ajuste-tel" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              Telefone para contato
            </label>
            <Input
              id="ajuste-tel"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              className="py-2.5"
            />
          </div>
          {profileMsg && (
            <p
              className={cn(
                "text-sm",
                profileMsg.startsWith("Perfil salvo") ? "text-emerald-600 dark:text-emerald-400" : "text-brand-pink"
              )}
              role="status"
            >
              {profileMsg}
            </p>
          )}
          <Button type="submit" className="w-full sm:w-auto" disabled={profileSaving}>
            {profileSaving ? "Salvando…" : "Salvar informações"}
          </Button>
        </form>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyIcon className="h-6 w-6 text-brand-purple" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Alterar senha</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Enviamos instruções para o e-mail da sua conta — o mesmo fluxo de «Esqueci minha senha» no login. O campo já vem
          preenchido com o e-mail do seu perfil (ou do último login), se houver.
        </p>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setForgotOpen(true)}>
          Abrir recuperação de senha
        </Button>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-brand-pink" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Lista de amigos</h2>
        </div>
        <DevSectionNotice />
        <p className="text-sm text-[var(--text-muted)]">
          Convide por e-mail, e gerencie quem aparece na sua lista de amigos.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="convite-email" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              E-mail do amigo
            </label>
            <Input
              id="convite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="amigo@email.com"
              className="py-2.5"
            />
          </div>
          <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={sendInvite}>
            <EnvelopeIcon className="h-5 w-5" aria-hidden />
            Enviar convite
          </Button>
        </div>
        {inviteMsg && (
          <p className="text-sm text-[var(--text-muted)]" role="status">
            {inviteMsg}
          </p>
        )}
        <ul className="divide-y divide-[var(--glass-border)] rounded-xl border border-[var(--glass-border)]">
          {amigos.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Nenhum amigo na lista ainda.</li>
          ) : (
            amigos.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{a.email}</span>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-red-500/35 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  onClick={() => removeAmigo(a.id)}
                  aria-label={`Remover ${a.email}`}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  Remover
                </Button>
              </li>
            ))
          )}
        </ul>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-6 w-6 text-brand-cyan" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Renovação do plano</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Próxima renovação prevista. Para cancelar a renovação automática, fale conosco pelo WhatsApp.
        </p>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_60%,transparent)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Data da próxima renovação</p>
          <p className="mt-1 text-lg font-semibold capitalize text-[var(--text-primary)]">{renewalDisplay}</p>
        </div>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={openCancelRenewalWhatsApp}>
          <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
          Cancelar renovação automática (WhatsApp)
        </Button>
      </GlassCard>

      <Dialog.Root
        open={emailConfirmOpen}
        onOpenChange={(open) => {
          if (!open) cancelEmailChange();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-[70] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
              "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
            )}
          />
          <Dialog.Content
            className="fixed inset-0 z-[70] flex max-h-dvh items-center justify-center overflow-y-auto p-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:p-6"
            aria-labelledby="ajuste-email-confirm-title"
            aria-describedby="ajuste-email-confirm-desc"
          >
            <motion.div
              className={cn(
                "relative w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
                "bg-[color-mix(in_srgb,var(--glass-bg)_78%,transparent)] p-5 shadow-glass-lg backdrop-blur-xl",
                "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
              )}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.36, ease }}
            >
              <div className="mb-3 h-1 w-full rounded-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />
              <div className="flex items-start justify-between gap-2">
                <Dialog.Title
                  id="ajuste-email-confirm-title"
                  className="text-lg font-bold text-[var(--text-primary)]"
                >
                  Confirmar troca de e-mail
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--glass-border)] p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label="Fechar"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description
                id="ajuste-email-confirm-desc"
                className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
              >
                Será enviado um e-mail de confirmação para{" "}
                <span className="font-semibold text-[var(--text-primary)]">{confirmEmailText}</span>. O novo endereço
                só passa a valer após você abrir o link recebido. Deseja continuar?
              </Dialog.Description>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={cancelEmailChange}>
                  Cancelar
                </Button>
                <Button type="button" className="w-full sm:w-auto" onClick={() => void confirmEmailChange()}>
                  Continuar
                </Button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={forgotInitialEmail} />
    </div>
  );
}
