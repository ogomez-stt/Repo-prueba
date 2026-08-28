import { Routes, Route, Navigate } from "react-router";
import { AppShell } from "@/app/AppShell";
import { DashboardPage } from "@/pages/dashboard";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import SignInForm from "@/pages/auth/sign-in";
import SignUpForm from "@/pages/auth/sign-up";
import ResetPasswordForm from "@/pages/auth/reset-password";
import { AuthPageLayout } from "@/layouts/auth";

/**
 * App - Clean starter application with minimal shell
 * 
 * This is the clean version for starting new applications.
 * Run with: npm run dev
 * 
 * For the full-featured demo, run: npm run demo
 * 
 * @agents Arquitectura de Rutas
 * 
 * Este archivo define todas las rutas de la aplicación. Las rutas se organizan
 * en dos categorías:
 * 
 * ## 1. Rutas con Shell
 * 
 * Las rutas que comparten el layout común (sidebar + header) van dentro de
 * `<Route element={<AppShell />}>`. El shell renderiza las rutas hijas usando
 * `<Outlet />`.
 * 
 * ```tsx
 * <Route element={<AppShell />}>
 *   <Route path="/" element={<Dashboard />} />
 *   <Route path="/users" element={<Users />} />
 *   <Route path="/settings" element={<Settings />} />
 * </Route>
 * ```
 * 
 * Para agregar una nueva página con shell:
 * 1. Crear el componente en `src/pages/`
 * 2. Importarlo aquí
 * 3. Agregar `<Route path="/ruta" element={<Componente />} />` dentro del shell
 * 4. Actualizar el menú en `AppSidebar.tsx`
 * 
 * ## 2. Rutas Standalone
 * 
 * Las rutas que NO usan el shell van fuera. Útil para:
 * - Login/Registro
 * - Landing pages
 * - Páginas de error
 * - Cualquier página con layout diferente
 * 
 * ```tsx
 * <Route path="/login" element={<LoginPage />} />
 * ```
 * 
 * ## Múltiples Shells (Micrositios)
 * 
 * Si necesitas diferentes layouts para diferentes secciones:
 * 
 * ```tsx
 * <Routes>
 *   <Route element={<AdminShell />}>
 *     <Route path="/admin/*" element={...} />
 *   </Route>
 *   <Route element={<PublicShell />}>
 *     <Route path="/public/*" element={...} />
 *   </Route>
 * </Routes>
 * ```
 * 
 * Ver `demo/DemoApp.tsx` para un ejemplo completo con documentación extendida.
 * 
 * ## Archivos Relacionados
 * 
 * - `AppShell.tsx` - Layout wrapper (sidebar + header + Outlet)
 * - `AppSidebar.tsx` - Menú de navegación (personalizar aquí)
 * - `../pages/` - Componentes de página
 * @kgId d91162d0d213
 */
export default function App() {
  return (
    <Routes>
      {/* ════════════════════════════════════════════════════════════════════
          RUTAS CON SHELL
          Páginas que comparten el layout AppShell (sidebar + header)
          ════════════════════════════════════════════════════════════════════ */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/turnos" element={<PlaceholderPage title="Mis Turnos" description="Gestiona tus turnos activos." />} />
        <Route path="/colas" element={<PlaceholderPage title="Colas" description="Administra las colas de atencion." />} />
        <Route path="/encuestas" element={<PlaceholderPage title="Encuestas" description="Encuestas de satisfaccion." />} />
        <Route path="/agendamiento" element={<PlaceholderPage title="Agenda" description="Vista principal de agendamientos." />} />
        <Route path="/agendamiento/detalles" element={<PlaceholderPage title="Detalles de agendamiento" description="Detalle de un agendamiento." />} />
        <Route path="/agendamiento/crear" element={<PlaceholderPage title="Crear agendamiento" description="Crea un nuevo agendamiento." />} />
        <Route path="/configuracion" element={<PlaceholderPage title="Configuracion" />} />
        <Route path="/ayuda" element={<PlaceholderPage title="Ayuda" />} />
      </Route>

      {/* ════════════════════════════════════════════════════════════════════
          RUTAS STANDALONE
          Páginas sin shell - tienen su propio layout completo
          ════════════════════════════════════════════════════════════════════ */}
      <Route path="/login" element={<AuthPageLayout><SignInForm /></AuthPageLayout>} />
      <Route path="/register" element={<AuthPageLayout><SignUpForm /></AuthPageLayout>} />
      <Route path="/forgot-password" element={<AuthPageLayout><ResetPasswordForm /></AuthPageLayout>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
