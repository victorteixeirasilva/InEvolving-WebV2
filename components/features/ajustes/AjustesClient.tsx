"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Label from "@radix-ui/react-label";
import * as Switch from "@radix-ui/react-switch";
import {
  EnvelopeIcon,
  KeyIcon,
  TrashIcon,
  UserCircleIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
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
import { STORAGE_KEYS, buildWhatsAppMessageUrl } from "@/lib/constants";
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

export function AjustesClient() {
  const { mode, toggle } = useThemeStore();
  const [profile, setProfile] = useState<AjustesProfile>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
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
  const hydrated = useRef(false);

  useLayoutEffect(() => {
    const p = loadAjustesProfile();
    const loginMail = readLoginEmail();
    if (!p.email && loginMail) {
      p.email = loginMail;
      saveAjustesProfile(p);
    }
    setProfile(p);

    let r = loadRenewalDate();
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEYS.ajustesRenewal)) {
      r = defaultNextRenewalDate();
      saveRenewalDate(r);
    }
    setRenewalDate(r);

    setAmigos(loadAmigos());
    hydrated.current = true;
  }, []);

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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!profile.name.trim()) {
      setProfileMsg("Informe seu nome.");
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
    const cpfDigits = profile.cpf.replace(/\D/g, "");
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      setProfileMsg("CPF inválido. Informe os 11 dígitos.");
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
      name: profile.name.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      cpf: profile.cpf.trim(),
      profilePhotoDataUrl: profile.profilePhotoDataUrl.trim(),
      birthDate: profile.birthDate.trim(),
      billingAddress: profile.billingAddress.trim(),
    };
    setProfile(next);
    saveAjustesProfile(next);
    setPwd("");
    setPwd2("");
    setProfileMsg(
      pwd
        ? "Perfil salvo. A senha não fica armazenada aqui — em produção a API atualizará. Use também «Alterar senha» para recuperação por e-mail."
        : "Perfil salvo neste dispositivo."
    );
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
        <DevSectionNotice />
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
                {profile.profilePhotoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profilePhotoDataUrl}
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
                {profile.profilePhotoDataUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-fit"
                    onClick={() => setProfile((p) => ({ ...p, profilePhotoDataUrl: "" }))}
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
          <Button type="submit" className="w-full sm:w-auto">
            Salvar informações
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

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={forgotInitialEmail} />
    </div>
  );
}
