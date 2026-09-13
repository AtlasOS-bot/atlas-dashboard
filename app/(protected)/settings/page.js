"use client";

import SettingsSection from "../../../components/SettingsSection";
import SubcategorySettingsSection from "../../../components/SubcategorySettingsSection";

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <h1 className="settings-page-title">Settings</h1>
      <p className="settings-page-subtitle">
        Manage the dropdown values used throughout NoMo.
      </p>

      <div className="settings-grid">
        <SettingsSection table="brands" label="Brands" />
        <SettingsSection table="categories" label="Categories" />
        <SubcategorySettingsSection />
        <SettingsSection table="platforms" label="Platforms" />
        <SettingsSection table="purchase_sources" label="Purchase Sources" />
        <SettingsSection table="storage_locations" label="Storage Locations" />
      </div>
    </div>
  );
}
