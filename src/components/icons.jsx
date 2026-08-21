/* eslint-disable react-refresh/only-export-components -- barrel de iconos Lucide + mapas de navegación */
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Bell,
  Menu,
  LogOut,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  X,
  Save,
  RefreshCw,
  Clock,
  LoaderCircle,
  CheckCircle2,
  Truck,
  AlertTriangle,
  PackageX,
  TrendingUp,
  FileText,
  Boxes,
  UserRound,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogIn,
} from "lucide-react";

/** Tamaño y grosor estándar en toda la app */
export const ICON = { size: 16, stroke: 1.75 };
export const ICON_NAV = { size: 18, stroke: 1.75 };

export const NAV_ICONS = {
  home: LayoutDashboard,
  box: Package,
  layers: Warehouse,
  users: Users,
  cart: ShoppingCart,
  invoice: Receipt,
  chart: BarChart3,
  shield: UserCog,
  settings: Settings,
};

export const ORDER_STATUS_ICONS = {
  PENDING: Clock,
  IN_PROCESS: LoaderCircle,
  COMPLETED: CheckCircle2,
  DELIVERED: Truck,
};

export {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Bell,
  Menu,
  LogOut,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  X,
  Save,
  RefreshCw,
  Clock,
  LoaderCircle,
  CheckCircle2,
  Truck,
  AlertTriangle,
  PackageX,
  TrendingUp,
  FileText,
  Boxes,
  UserRound,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogIn,
};

export function NavIcon({ name }) {
  const Icon = NAV_ICONS[name] || LayoutDashboard;
  return <Icon {...ICON_NAV} aria-hidden="true" />;
}
