import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ReactDOM from "react-dom/client";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/styles/tailwind.css";

// layouts

import Admin from "layouts/Admin.js";
import Auth from "layouts/Auth.js";

// views without layouts

import Landing from "views/Landing.js";
import Profile from "views/Profile.js";
import Index from "views/Index.js";
import Login from "views/auth/Login";
import Register from "views/auth/Register";

// views

import Dashboard from "views/admin/Dashboard.js";
import Maps from "views/admin/Maps.js";
import Settings from "views/admin/Settings.js";
import Tables from "views/admin/Tables.js";
import ProductsList from "views/admin/Products";
import CategoriesList from "views/admin/categories";
import ProductPage from "views/admin/product";
import OrderdsPage from "views/admin/orders";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <BrowserRouter>
    <Routes>
      {/* add routes with layouts */}
      <Route path="/admin" element={<Admin />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/categories" element={<CategoriesList />} />
        <Route path="/admin/categories/:id" element={<ProductsList />} />
        <Route path="/admin/products" element={<ProductsList />} />
        <Route path="/admin/product" element={<ProductPage />} />
        <Route path="/admin/product/add" element={<ProductPage />} />
        <Route path="/admin/product/:id" element={<ProductPage />} />
        <Route path="/admin/orders" element={<OrderdsPage />} />
        <Route path="/admin/maps" element={<Maps />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/tables" element={<Tables />} />
        <Route path="" element={<Navigate to="/admin/dashboard" />} />
      </Route>
      <Route path="auth" element={<Auth />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="" element={<Navigate to="/auth/login" />} />
      </Route>
      {/* add routes without layouts */}
      <Route path="/landing" element={<Landing />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/" element={<Index />} />
    </Routes>
  </BrowserRouter>
);
