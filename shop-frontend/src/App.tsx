import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Storefront } from "./pages/shop";
import { AdminDashboard } from "./pages/admin-dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Storefront />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
