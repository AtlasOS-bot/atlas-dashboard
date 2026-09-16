"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCurrentUser } from "../lib/currentUserContext";
import { logHistory } from "../lib/inventoryHistory";
import { quickAddLookupValue } from "../lib/quickAdd";
import SelectWithQuickAdd from "./SelectWithQuickAdd";
import { devLog } from "../lib/devLog";

const UNCONFIGURED_ACCOUNT_MESSAGE =
  "Your account isn't set up for inventory changes yet. Contact the workspace owner to get this fixed.";

function extractStoragePath(url) {
  const marker = "/product-images/";
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

function buildForm(product) {
  return {
    item_name: product.item_name || "",
    product_link: product.product_link || "",
    brand_id: product.brand_id ? String(product.brand_id) : "",
    category_id: product.category_id ? String(product.category_id) : "",
    subcategory_id: product.subcategory_id ? String(product.subcategory_id) : "",
    n_quantity: String(product.n_quantity ?? 0),
    m_quantity: String(product.m_quantity ?? 0),
    shared_quantity: String(product.shared_quantity ?? 0),
    cost_each: product.cost_each != null ? String(product.cost_each) : "",
    market_price: product.market_price != null ? String(product.market_price) : "",
    storage_location_id: product.storage_location_id
      ? String(product.storage_location_id)
      : "",
    purchase_source_id: product.purchase_source_id
      ? String(product.purchase_source_id)
      : "",
    purchase_date: product.purchase_date || "",
    notes: product.notes || "",
  };
}

function buildPlatforms(product) {
  const initial = {};
  (product.product_platforms || []).forEach((pp) => {
    if (pp.platform_id) {
      initial[pp.platform_id] = {
        is_listed: pp.is_listed,
        listing_url: pp.listing_url || "",
      };
    }
  });
  return initial;
}

export default function EditItemPanel({ product, onClose, onSaved, onDeleted }) {
  const { person } = useCurrentUser();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [purchaseSources, setPurchaseSources] = useState([]);

  const [form, setForm] = useState(() => buildForm(product));
  const [savedForm, setSavedForm] = useState(() => buildForm(product));

  const [images, setImages] = useState(product.product_images || []);

  const [selectedPlatforms, setSelectedPlatforms] = useState(() =>
    buildPlatforms(product)
  );
  const [savedPlatforms, setSavedPlatforms] = useState(() =>
    buildPlatforms(product)
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(savedForm) ||
    JSON.stringify(selectedPlatforms) !== JSON.stringify(savedPlatforms);

  function requestClose() {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }

  useEffect(() => {
    async function loadOptions() {
      const [
        { data: brandData },
        { data: categoryData },
        { data: subcategoryData },
        { data: platformData },
        { data: storageData },
        { data: sourceData },
      ] = await Promise.all([
        supabase.from("brands").select("*").eq("active", true).order("sort_order"),
        supabase.from("categories").select("*").eq("active", true).order("sort_order"),
        supabase.from("subcategories").select("*").eq("active", true).order("sort_order"),
        supabase.from("platforms").select("*").eq("active", true).order("sort_order"),
        supabase.from("storage_locations").select("*").eq("active", true).order("sort_order"),
        supabase.from("purchase_sources").select("*").eq("active", true).order("sort_order"),
      ]);

      setBrands(brandData || []);
      setCategories(categoryData || []);
      setSubcategories(subcategoryData || []);
      setPlatforms(platformData || []);
      setStorageLocations(storageData || []);
      setPurchaseSources(sourceData || []);
    }

    loadOptions();
  }, []);

  const visibleSubcategories = subcategories.filter(
    (sub) => String(sub.category_id) === String(form.category_id)
  );

  async function handleQuickAddBrand() {
    const created = await quickAddLookupValue("brands", brands);
    if (!created) return;
    setBrands((prev) => [...prev, created]);
    updateField("brand_id", String(created.id));
  }

  async function handleQuickAddCategory() {
    const created = await quickAddLookupValue("categories", categories);
    if (!created) return;
    setCategories((prev) => [...prev, created]);
    updateField("category_id", String(created.id));
    updateField("subcategory_id", "");
  }

  async function handleQuickAddSubcategory() {
    if (!form.category_id) {
      alert("Select a category first.");
      return;
    }
    const created = await quickAddLookupValue("subcategories", visibleSubcategories, {
      category_id: Number(form.category_id),
    });
    if (!created) return;
    setSubcategories((prev) => [...prev, created]);
    updateField("subcategory_id", String(created.id));
  }

  async function handleQuickAddStorageLocation() {
    const created = await quickAddLookupValue("storage_locations", storageLocations);
    if (!created) return;
    setStorageLocations((prev) => [...prev, created]);
    updateField("storage_location_id", String(created.id));
  }

  async function handleQuickAddPurchaseSource() {
    const created = await quickAddLookupValue("purchase_sources", purchaseSources);
    if (!created) return;
    setPurchaseSources((prev) => [...prev, created]);
    updateField("purchase_source_id", String(created.id));
  }

  async function handleQuickAddPlatform() {
    const created = await quickAddLookupValue("platforms", platforms);
    if (!created) return;
    setPlatforms((prev) => [...prev, created]);
    setSelectedPlatforms((prev) => ({
      ...prev,
      [created.id]: { is_listed: false, listing_url: "" },
    }));
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function togglePlatform(platformId) {
    setSelectedPlatforms((prev) => {
      const next = { ...prev };
      if (next[platformId]) {
        delete next[platformId];
      } else {
        next[platformId] = { is_listed: false, listing_url: "" };
      }
      return next;
    });
  }

  function updatePlatformField(platformId, field, value) {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], [field]: value },
    }));
  }

  async function uploadImage(file, prefix) {
    const path = `${product.id}/${prefix}-${Date.now()}-${file.name}`;
    devLog("Uploading to Supabase Storage...", {
      path,
      size: file.size,
      type: file.type,
    });

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      devLog("✗ Supabase Storage upload failed", {
        message: uploadError.message,
        name: uploadError.name,
        status: uploadError.statusCode || uploadError.status,
        raw: uploadError,
      });
      throw uploadError;
    }

    devLog("✓ Uploaded to Supabase Storage", { path });

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);

    if (!data?.publicUrl) {
      devLog("✗ getPublicUrl returned no URL for path", { path, data });
    } else {
      devLog("✓ Public storage path resolved", data.publicUrl);
    }

    return data.publicUrl;
  }

  async function handleDeleteImage(image) {
    setError("");

    if (!person) {
      setError(UNCONFIGURED_ACCOUNT_MESSAGE);
      return;
    }

    const path = extractStoragePath(image.image_url);
    if (path) {
      await supabase.storage.from("product-images").remove([path]);
    }

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);

    if (deleteError) {
      setError(`Could not delete that image: ${deleteError.message}`);
      return;
    }

    setImages((prev) => prev.filter((img) => img.id !== image.id));

    await logHistory({
      person,
      entityType: "product",
      entityId: product.id,
      action: "Images Removed",
    });
  }

  async function handleSetPrimary(image) {
    setError("");

    if (!person) {
      setError(UNCONFIGURED_ACCOUNT_MESSAGE);
      return;
    }

    const currentPrimary = images.find((img) => img.is_main);

    if (currentPrimary && currentPrimary.id !== image.id) {
      await supabase
        .from("product_images")
        .update({ is_main: false })
        .eq("id", currentPrimary.id);
    }

    const { error: updateError } = await supabase
      .from("product_images")
      .update({ is_main: true })
      .eq("id", image.id);

    if (updateError) {
      setError(`Could not update the primary image: ${updateError.message}`);
      return;
    }

    setImages((prev) =>
      prev.map((img) => ({ ...img, is_main: img.id === image.id }))
    );

    await logHistory({
      person,
      entityType: "product",
      entityId: product.id,
      action: "Primary Image Changed",
    });
  }

  async function handleReplacePrimaryImage(file) {
    if (!file) return;
    setError("");

    if (!person) {
      setError(UNCONFIGURED_ACCOUNT_MESSAGE);
      return;
    }

    const oldPrimary = images.find((img) => img.is_main);

    try {
      if (oldPrimary) {
        await supabase
          .from("product_images")
          .update({ is_main: false })
          .eq("id", oldPrimary.id);
      }

      const url = await uploadImage(file, "primary");

      const { data: newRow, error: insertError } = await supabase
        .from("product_images")
        .insert({
          product_id: product.id,
          image_url: url,
          is_main: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (oldPrimary) {
        const oldPath = extractStoragePath(oldPrimary.image_url);
        if (oldPath) {
          await supabase.storage.from("product-images").remove([oldPath]);
        }
        await supabase.from("product_images").delete().eq("id", oldPrimary.id);
      }

      setImages((prev) => [
        ...prev.filter((img) => img.id !== oldPrimary?.id),
        newRow,
      ]);

      await logHistory({
        person,
        entityType: "product",
        entityId: product.id,
        action: "Primary Image Changed",
      });
    } catch (err) {
      setError(`Could not replace the primary image: ${err.message || "unknown error"}`);
    }
  }

  async function handleAddImages(files) {
    if (!files || files.length === 0) return;
    setError("");

    if (!person) {
      setError(UNCONFIGURED_ACCOUNT_MESSAGE);
      return;
    }

    const newRows = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadImage(files[i], `extra-${Date.now()}-${i}`);
        const { data: row, error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: url,
            is_main: false,
            sort_order: images.length + i + 1,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        newRows.push(row);
      } catch (err) {
        setError(`Image upload failed: ${err.message || "unknown error"}`);
      }
    }

    if (newRows.length > 0) {
      setImages((prev) => [...prev, ...newRows]);

      await logHistory({
        person,
        entityType: "product",
        entityId: product.id,
        action: "Images Added",
      });
    }
  }

  async function handleSave() {
    setError("");

    if (!form.item_name.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!person) {
      setError(UNCONFIGURED_ACCOUNT_MESSAGE);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        item_name: form.item_name.trim(),
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        n_quantity: form.n_quantity === "" ? 0 : Number(form.n_quantity),
        m_quantity: form.m_quantity === "" ? 0 : Number(form.m_quantity),
        shared_quantity:
          form.shared_quantity === "" ? 0 : Number(form.shared_quantity),
        cost_each: form.cost_each === "" ? null : Number(form.cost_each),
        market_price: form.market_price === "" ? null : Number(form.market_price),
        storage_location_id: form.storage_location_id
          ? Number(form.storage_location_id)
          : null,
        purchase_source_id: form.purchase_source_id
          ? Number(form.purchase_source_id)
          : null,
        purchase_date: form.purchase_date || null,
        notes: form.notes.trim() || null,
        product_link: form.product_link.trim() || null,
      };

      // Snapshot what actually changed against the pre-edit product, before
      // the update runs, so history reflects a real before/after delta.
      const changedActions = [];

      if (
        payload.n_quantity !== (product.n_quantity ?? 0) ||
        payload.m_quantity !== (product.m_quantity ?? 0) ||
        payload.shared_quantity !== (product.shared_quantity ?? 0)
      ) {
        changedActions.push("Quantity Changed");
      }

      if (payload.brand_id !== (product.brand_id ?? null)) {
        changedActions.push("Brand Changed");
      }

      if (payload.category_id !== (product.category_id ?? null)) {
        changedActions.push("Category Changed");
      }

      if (payload.storage_location_id !== (product.storage_location_id ?? null)) {
        changedActions.push("Storage Changed");
      }

      if (payload.purchase_source_id !== (product.purchase_source_id ?? null)) {
        changedActions.push("Purchase Source Changed");
      }

      if (
        payload.cost_each !== (product.cost_each ?? null) ||
        payload.market_price !== (product.market_price ?? null)
      ) {
        changedActions.push("Price Changed");
      }

      const platformsChanged =
        JSON.stringify(selectedPlatforms) !== JSON.stringify(savedPlatforms);

      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);

      if (updateError) throw updateError;

      setSavedForm(form);

      for (const action of changedActions) {
        await logHistory({
          person,
          entityType: "product",
          entityId: product.id,
          action,
        });
      }

      const warnings = [];
      let platformsSaved = true;

      const { error: clearError } = await supabase
        .from("product_platforms")
        .delete()
        .eq("product_id", product.id);

      if (clearError) {
        platformsSaved = false;
        warnings.push("Platform details could not be updated.");
      } else {
        const platformRows = Object.entries(selectedPlatforms).map(
          ([platformId, details]) => ({
            product_id: product.id,
            platform_id: Number(platformId),
            is_listed: details.is_listed,
            listing_url: details.listing_url.trim() || null,
          })
        );

        if (platformRows.length > 0) {
          let { error: platformError } = await supabase
            .from("product_platforms")
            .insert(platformRows);

          if (platformError) {
            ({ error: platformError } = await supabase
              .from("product_platforms")
              .insert(platformRows));
          }

          if (platformError) {
            platformsSaved = false;
            warnings.push(
              "Platform listings were not saved. Try editing this item again."
            );
          }
        }
      }

      if (platformsSaved) {
        setSavedPlatforms(selectedPlatforms);

        if (platformsChanged) {
          await logHistory({
            person,
            entityType: "product",
            entityId: product.id,
            action: "Platform Changed",
          });
        }
      }

      await onSaved();

      if (warnings.length > 0) {
        setError(warnings.join(" "));
        setSaving(false);
        return;
      }

      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    const confirmed = window.confirm(
      `Permanently delete "${product.item_name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");

    if (!person) {
      setError(UNCONFIGURED_ACCOUNT_MESSAGE);
      return;
    }

    setDeleting(true);

    try {
      const { data: existingSales, error: salesCheckError } = await supabase
        .from("sales")
        .select("id")
        .eq("product_id", product.id)
        .limit(1);

      if (salesCheckError) throw salesCheckError;

      if (existingSales && existingSales.length > 0) {
        setError(
          "This item has sales history and can't be deleted. Mark it Out of Stock instead."
        );
        setDeleting(false);
        return;
      }

      const paths = images
        .map((img) => extractStoragePath(img.image_url))
        .filter(Boolean);

      if (paths.length > 0) {
        await supabase.storage.from("product-images").remove(paths);
      }

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        if (deleteError.message?.toLowerCase().includes("foreign key")) {
          setError(
            "This item has sales history and can't be deleted. Mark it Out of Stock instead."
          );
        } else {
          throw deleteError;
        }
        setDeleting(false);
        return;
      }

      await onDeleted();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong while deleting.");
      setDeleting(false);
    }
  }

  return (
    <div className="detail-panel-overlay" onClick={requestClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel-header">
          <h2>Edit Item</h2>
          <button className="detail-panel-close" onClick={requestClose}>
            ✕
          </button>
        </div>

        {showUnsavedWarning && (
          <div className="unsaved-warning-overlay">
            <div className="unsaved-warning-box">
              <p>You have unsaved changes.</p>
              <div className="unsaved-warning-actions">
                <button
                  className="inventory-add-button"
                  onClick={() => setShowUnsavedWarning(false)}
                >
                  Stay Editing
                </button>
                <button className="delete-item-button" onClick={onClose}>
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="detail-panel-body">
          <label className="form-field">
            <span className="detail-label">Item Name *</span>
            <input
              className="form-input"
              type="text"
              value={form.item_name}
              onChange={(e) => updateField("item_name", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Product Link</span>
            <input
              className="form-input"
              type="text"
              placeholder="Paste a product link"
              value={form.product_link}
              onChange={(e) => updateField("product_link", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Brand</span>
            <SelectWithQuickAdd
              value={form.brand_id}
              onChange={(value) => updateField("brand_id", value)}
              options={brands}
              onAdd={handleQuickAddBrand}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Category</span>
            <SelectWithQuickAdd
              value={form.category_id}
              onChange={(value) => {
                updateField("category_id", value);
                updateField("subcategory_id", "");
              }}
              options={categories}
              onAdd={handleQuickAddCategory}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Subcategory</span>
            <SelectWithQuickAdd
              value={form.subcategory_id}
              onChange={(value) => updateField("subcategory_id", value)}
              options={visibleSubcategories}
              onAdd={handleQuickAddSubcategory}
              disabled={!form.category_id}
            />
          </label>

          <div className="detail-divider" />

          <label className="form-field">
            <span className="detail-label">N Qty</span>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1"
              value={form.n_quantity}
              onChange={(e) => updateField("n_quantity", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">M Qty</span>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1"
              value={form.m_quantity}
              onChange={(e) => updateField("m_quantity", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Shared Qty</span>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1"
              value={form.shared_quantity}
              onChange={(e) => updateField("shared_quantity", e.target.value)}
            />
          </label>

          <div className="detail-divider" />

          <label className="form-field">
            <span className="detail-label">Cost Each</span>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_each}
              onChange={(e) => updateField("cost_each", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Market Price</span>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              value={form.market_price}
              onChange={(e) => updateField("market_price", e.target.value)}
            />
          </label>

          <div className="detail-divider" />

          <label className="form-field">
            <span className="detail-label">Storage Location</span>
            <SelectWithQuickAdd
              value={form.storage_location_id}
              onChange={(value) => updateField("storage_location_id", value)}
              options={storageLocations}
              onAdd={handleQuickAddStorageLocation}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Purchase Source</span>
            <SelectWithQuickAdd
              value={form.purchase_source_id}
              onChange={(value) => updateField("purchase_source_id", value)}
              options={purchaseSources}
              onAdd={handleQuickAddPurchaseSource}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Purchase Date</span>
            <input
              className="form-input"
              type="date"
              value={form.purchase_date}
              onChange={(e) => updateField("purchase_date", e.target.value)}
            />
          </label>

          <div className="detail-divider" />

          <div className="form-field">
            <div className="detail-label-row">
              <span className="detail-label">Platforms</span>
              <button
                type="button"
                className="quick-add-button"
                onClick={handleQuickAddPlatform}
                title="Add new platform"
              >
                +
              </button>
            </div>
            <div className="platform-form-list">
              {platforms.map((platform) => {
                const selected = selectedPlatforms[platform.id];
                return (
                  <div key={platform.id} className="platform-form-row">
                    <label className="platform-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={() => togglePlatform(platform.id)}
                      />
                      {platform.name}
                    </label>

                    {selected && (
                      <div className="platform-form-details">
                        <label className="platform-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selected.is_listed}
                            onChange={(e) =>
                              updatePlatformField(
                                platform.id,
                                "is_listed",
                                e.target.checked
                              )
                            }
                          />
                          Listed
                        </label>

                        {selected.is_listed && (
                          <input
                            className="form-input"
                            type="text"
                            placeholder="Listing URL"
                            value={selected.listing_url}
                            onChange={(e) =>
                              updatePlatformField(
                                platform.id,
                                "listing_url",
                                e.target.value
                              )
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-divider" />

          <div className="form-field">
            <span className="detail-label">Images</span>

            {images.length === 0 ? (
              <p className="detail-value">No images yet.</p>
            ) : (
              <div className="image-manager-grid">
                {images.map((image) => (
                  <div key={image.id} className="image-manager-item">
                    <img
                      src={image.image_url}
                      alt=""
                      className="image-manager-thumb"
                    />

                    {image.is_main ? (
                      <span className="image-manager-primary-badge">Primary</span>
                    ) : (
                      <button
                        type="button"
                        className="image-manager-action"
                        onClick={() => handleSetPrimary(image)}
                      >
                        Set as Primary
                      </button>
                    )}

                    <button
                      type="button"
                      className="image-manager-action image-manager-delete"
                      onClick={() => handleDeleteImage(image)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="form-field">
            <span className="detail-label">Replace Primary Image</span>
            <input
              className="form-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleReplacePrimaryImage(e.target.files?.[0] || null);
                e.target.value = "";
              }}
            />
          </label>

          <label className="form-field">
            <span className="detail-label">Add More Images</span>
            <input
              className="form-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleAddImages(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
          </label>

          <div className="detail-divider" />

          <label className="form-field">
            <span className="detail-label">Notes</span>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </label>

          <button
            className="inventory-add-button form-save-button"
            onClick={handleSave}
            disabled={saving || deleting}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            className="delete-item-button"
            onClick={handleDeleteProduct}
            disabled={saving || deleting}
          >
            {deleting ? "Deleting..." : "Delete Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
