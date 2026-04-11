import {
  HomeIcon,
  FlagIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  BookOpenIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export type NavItem = {
  href: string;
  label: string;
  /** Texto na bottom bar (telas estreitas); sidebar/drawer usam `label`. */
  bottomNavLabel?: string;
  icon: typeof HomeIcon;
  bottom?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", bottomNavLabel: "Início", icon: HomeIcon, bottom: true },
  { href: "/objetivos", label: "Objetivos", bottomNavLabel: "Metas", icon: FlagIcon, bottom: true },
  { href: "/tarefas", label: "Tarefas", bottomNavLabel: "Tarefas", icon: ClipboardDocumentListIcon, bottom: true },
  { href: "/financas", label: "Finanças", bottomNavLabel: "Finanç.", icon: BanknotesIcon, bottom: true },
  { href: "/livros", label: "Livros", icon: BookOpenIcon },
  { href: "/motivacao", label: "Motivação", icon: SparklesIcon },
  { href: "/ajustes", label: "Ajustes", icon: Cog6ToothIcon },
  { href: "/ajuda", label: "Ajuda", icon: ChatBubbleLeftRightIcon },
];

export const BOTTOM_NAV = NAV_ITEMS.filter((i) => i.bottom);
