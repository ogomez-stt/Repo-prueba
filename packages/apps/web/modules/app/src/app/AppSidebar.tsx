import { Link, useNavigate, useLocation } from "react-router";
import { observer } from "mobx-react-lite";
import {
  BaseAppSidebar,
  MenuSectionHeader,
  MenuItem,
} from "@/shell";
import { useSidebarContext } from "@/shell/sidebar/SidebarContext";
import {
  GridIcon,
  TaskIcon,
  ListIcon,
  ShootingStarIcon,
  PlugInIcon,
  InfoIcon,
  ArrowRightIcon,
} from "@/icons";

// ═══════════════════════════════════════════════════════════════════════════
// LOGO COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const Logo = () => (
  <Link to="/dashboard" className="flex items-center">
    <img
      src="/images/logo/necto-full.svg"
      alt="NECTO"
      className="h-5 w-auto"
    />
  </Link>
);

const LogoCollapsed = () => (
  <Link
    to="/dashboard"
    className="flex items-center justify-center h-10 w-10 rounded-xl border-2 border-brand-500"
  >
    <img
      src="/images/logo/necto-icon.png"
      alt="NECTO"
      className="h-5 w-auto"
    />
  </Link>
);

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER — pinned actions (Configuracion, Ayuda, Cerrar sesion)
// ═══════════════════════════════════════════════════════════════════════════

const SidebarFooter = observer(() => {
  const { isExpanded: showExpanded } = useSidebarContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: integrate with Cognito sign-out
    navigate("/login");
  };

  const rowClasses = `menu-item group menu-item-inactive ${
    !showExpanded ? "xl:justify-center" : "xl:justify-start"
  }`;

  return (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 pb-6">
      <ul className="flex flex-col gap-1">
        <li>
          <Link to="/configuracion" className={rowClasses}>
            <span className="menu-item-icon-size menu-item-icon-inactive">
              <PlugInIcon />
            </span>
            {showExpanded && <span className="menu-item-text">Configuracion</span>}
          </Link>
        </li>
        <li>
          <Link to="/ayuda" className={rowClasses}>
            <span className="menu-item-icon-size menu-item-icon-inactive">
              <InfoIcon />
            </span>
            {showExpanded && <span className="menu-item-text">Ayuda</span>}
          </Link>
        </li>
        <li>
          <button
            onClick={handleLogout}
            className={`menu-item group text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 cursor-pointer ${
              !showExpanded ? "xl:justify-center" : "xl:justify-start"
            }`}
          >
            <span className="menu-item-icon-size text-error-500">
              <ArrowRightIcon />
            </span>
            {showExpanded && <span className="menu-item-text">Cerrar sesion</span>}
          </button>
        </li>
      </ul>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR CONTENT — Sistema de Turnos
// ═══════════════════════════════════════════════════════════════════════════

const SidebarContent = () => {
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex flex-col flex-1">
      <div>
        <MenuSectionHeader title="Menu" />
        <ul className="flex flex-col gap-1">
          <MenuItem icon={<GridIcon />} name="Inicio" path="/dashboard" isActive={isActive} />
          <MenuItem icon={<TaskIcon />} name="Mis Turnos" path="/turnos" isActive={isActive} />
          <MenuItem icon={<ListIcon />} name="Colas" path="/colas" isActive={isActive} />
          <MenuItem icon={<ShootingStarIcon />} name="Encuestas" path="/encuestas" isActive={isActive} />
        </ul>
      </div>

      <SidebarFooter />
    </nav>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AppSidebar — NECTO-branded navigation for the queue management system.
 * @kgId 8025fcb3eb97
 */
export const AppSidebar = () => (
  <BaseAppSidebar logo={<Logo />} logoCollapsed={<LogoCollapsed />}>
    <SidebarContent />
  </BaseAppSidebar>
);

export default AppSidebar;
