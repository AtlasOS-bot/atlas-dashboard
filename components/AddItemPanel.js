"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCurrentUser } from "../lib/currentUserContext";
import { logHistory } from "../lib/inventoryHistory";
import { quickAddLookupValue } from "../lib/quickAdd";
import SelectWithQuickAdd from "./SelectWithQuickAdd";
import { devLog } from "../lib/devLog";

const LOOKUP_DEBOUNCE_MS = 600;

// The four platforms with per-person (N/M) listing tracking. Selecting one
// of these attributes the resulting product_platforms row to whichever
// person is currently authenticated. Any other platform keeps the prior,
// person-less behavior exactly as it worked before that tracking existed.
const PERSON_TRACKED_PLATFORM_NAMES = [
  "Mercari",
  "eBay",
  "Facebook Marketplace",
  "OfferUp",
];

const emptyForm = {
  item_name: "",
  brand_id: "",
  category_id: "",
  subcategory_id: "",
  n_quantity: "",
  m_quantity: "",
  shared_quantity: "",
  cost_each: "",
  market_price: "",
  storage_location_id: "",
  purchase_source_id: "",
  purchase_date: "",
  notes: "",
};

export default function AddItemPanel({ onClose, onCreated }) {
  const { person } = useCurrentUser();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [purchaseSources, setPurchaseSources] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [primaryImage, setPrimaryImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  const [productLink, setProductLink] = useState("");
  const [lookupStatus, setLookupStatus] = useState("idle"); // idle | loading | done
  const [lookupMessage, setLookupMessage] = useState("");
  const lookupRequestId = useRef(0);
  const lastLookedUpLink = useRef("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const trimmed = productLink.trim();

    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      return;
    }

    if (trimmed === lastLookedUpLink.current) {
      return;
    }

    const timer = setTimeout(() => {
      runLookup(trimmed);
    }, LOOKUP_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productLink]);

  async function runLookup(url) {
    const requestId = ++lookupRequestId.current;
    lastLookedUpLink.current = url;
    setLookupStatus("loading");
    setLookupMessage("");

    let result;
    try {
      const response = await fetch("/api/product-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      result = await response.json();
    } catch (err) {
      result = { supported: true, error: "Could not check that link right now." };
    }

    // Ignore stale responses if the user has since changed the link.
    if (requestId !== lookupRequestId.current) return;

    if (!result.supported) {
      setLookupStatus("done");
      setLookupMessage(
        "We don't support that link yet — you can still add this item manually."
      );
      return;
    }

    if (!result.product) {
      setLookupStatus("done");
      setLookupMessage(
        result.error ||
          `We found ${result.retailer} but couldn't read the product details. You can still add this item manually.`
      );
      return;
    }

    const imageWarning = await applyLookupResult(result.product);
    setLookupStatus("done");
    setLookupMessage(
      imageWarning
        ? `Imported details from ${result.retailer}. ${imageWarning}`
        : `Imported details from ${result.retailer}.`
    );
  }

  async function applyLookupResult(product) {
    setForm((prev) => ({
      ...prev,
      item_name: prev.item_name || product.item_name || prev.item_name,
      cost_each:
        prev.cost_each === "" && product.price != null
          ? String(product.price)
          : prev.cost_each,
    }));

    // Brand only fills in on an exact, case-insensitive name match against
    // the managed Brands list — no fuzzy matching. Blank is better than wrong.
    if (product.brand) {
      const match = brands.find(
        (b) => b.name.toLowerCase() === product.brand.toLowerCase()
      );
      if (match) {
        setForm((prev) =>
          prev.brand_id ? prev : { ...prev, brand_id: String(match.id) }
        );
      }
    }

    if (product.category) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === product.category.toLowerCase()
      );
      if (match) {
        setForm((prev) =>
          prev.category_id ? prev : { ...prev, category_id: String(match.id) }
        );
      }
    }

    if (product.purchase_source) {
      const match = purchaseSources.find(
        (s) => s.name.toLowerCase() === product.purchase_source.toLowerCase()
      );
      if (match) {
        setForm((prev) =>
          prev.purchase_source_id
            ? prev
            : { ...prev, purchase_source_id: String(match.id) }
        );
      }
    }

    if (product.image_url) {
      devLog("✓ Lookup returned image URL", product.image_url);
    } else {
      devLog("✗ Lookup did not return an image URL — nothing to import");
    }

    if (product.image_url && !primaryImage) {
      try {
        const response = await fetch(
          `/api/product-image?url=${encodeURIComponent(product.image_url)}`
        );
        if (response.ok) {
          devLog("✓ Retailer image downloaded", {
            status: response.status,
            contentType: response.headers.get("content-type"),
          });

          const blob = await response.blob();
          devLog("✓ Received image bytes (not HTML/error page)", {
            size: blob.size,
            type: blob.type,
          });

          const file = new File([blob], "imported-image.jpg", {
            type: blob.type || "image/jpeg",
          });
          devLog("✓ Converted to File", {
            name: file.name,
            size: file.size,
            type: file.type,
          });

          setPrimaryImage((current) => current || file);
        } else {
          const body = await response.json().catch(() => null);
          devLog("✗ Retailer image download failed", {
            status: response.status,
            error: body?.error,
          });
          return body?.error || "Could not download the product image.";
        }
      } catch (err) {
        devLog("✗ Retailer image download threw an exception", err);
        return "Could not download the product image.";
      }
    }

    return null;
  }

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

  const primaryImagePreviewUrl = useMemo(() => {
    if (!primaryImage) return null;
    return URL.createObjectURL(primaryImage);
  }, [primaryImage]);

  useEffect(() => {
    return () => {
      if (primaryImagePreviewUrl) URL.revokeObjectURL(primaryImagePreviewUrl);
    };
  }, [primaryImagePreviewUrl]);

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

  async function uploadImage(file, prefix, productId) {
    const path = `${productId}/${prefix}-${Date.now()}-${file.name}`;
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

  async function handleSubmit() {
    setError("");
    setSuccessMessage("");

    if (!form.item_name.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!person) {
      setError(
        "Your account isn't set up for inventory changes yet. Contact the workspace owner to get this fixed."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = { item_name: form.item_name.trim() };

      if (form.brand_id) payload.brand_id = Number(form.brand_id);
      if (form.category_id) payload.category_id = Number(form.category_id);
      if (form.subcategory_id) payload.subcategory_id = Number(form.subcategory_id);
      if (form.n_quantity !== "") payload.n_quantity = Number(form.n_quantity);
      if (form.m_quantity !== "") payload.m_quantity = Number(form.m_quantity);
      if (form.shared_quantity !== "")
        payload.shared_quantity = Number(form.shared_quantity);
      if (form.cost_each !== "") payload.cost_each = Number(form.cost_each);
      if (form.market_price !== "") payload.market_price = Number(form.market_price);
      if (form.storage_location_id)
        payload.storage_location_id = Number(form.storage_location_id);
      if (form.purchase_source_id)
        payload.purchase_source_id = Number(form.purchase_source_id);
      if (form.purchase_date) payload.purchase_date = form.purchase_date;
      if (form.notes.trim()) payload.notes = form.notes.trim();
      if (productLink.trim()) payload.product_link = productLink.trim();

      const { data: product, error: insertError } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      await logHistory({
        person,
        entityType: "product",
        entityId: product.id,
        action: "Item Created",
        notes: `${product.item_name} (${product.inventory_id})`,
      });

      // The product now exists. Everything below is best-effort — a failure
      // here must never undo or hide the product that was just created.
      const warnings = [];

      const filesToUpload = [];
      if (primaryImage) filesToUpload.push({ file: primaryImage, isMain: true });
      additionalImages.forEach((file) => filesToUpload.push({ file, isMain: false }));

      if (filesToUpload.length > 0) {
        const imageRows = [];

        for (let i = 0; i < filesToUpload.length; i++) {
          const { file, isMain } = filesToUpload[i];
          try {
            const url = await uploadImage(
              file,
              isMain ? "primary" : `extra-${i}`,
              product.id
            );
            imageRows.push({
              product_id: product.id,
              image_url: url,
              is_main: isMain,
              sort_order: i,
            });
          } catch (uploadErr) {
            devLog("✗ Image upload step threw", uploadErr);
            warnings.push(
              `Image upload failed: ${uploadErr.message || "unknown error"}.`
            );
          }
        }

        if (imageRows.length > 0) {
          devLog("Inserting product_images row(s)...", imageRows);

          const { error: imageInsertError } = await supabase
            .from("product_images")
            .insert(imageRows);

          if (imageInsertError) {
            devLog("✗ product_images insert failed", {
              message: imageInsertError.message,
              details: imageInsertError.details,
              hint: imageInsertError.hint,
              code: imageInsertError.code,
            });
            warnings.push(
              `Images uploaded but could not be attached: ${imageInsertError.message}.`
            );
          } else {
            devLog("✓ product_images row inserted", imageRows.length);
          }
        }
      }

      const platformRows = Object.entries(selectedPlatforms).map(
        ([platformId, details]) => {
          const platform = platforms.find(
            (p) => String(p.id) === String(platformId)
          );
          const isPersonTracked = Boolean(
            platform && PERSON_TRACKED_PLATFORM_NAMES.includes(platform.name)
          );

          return {
            product_id: product.id,
            platform_id: Number(platformId),
            is_listed: isPersonTracked ? true : details.is_listed,
            listing_url: details.listing_url.trim() || null,
            person: isPersonTracked ? person : null,
          };
        }
      );

      if (platformRows.length > 0) {
        let { error: platformError } = await supabase
          .from("product_platforms")
          .insert(platformRows);

        if (platformError) {
          // Retry once before giving up.
          ({ error: platformError } = await supabase
            .from("product_platforms")
            .insert(platformRows));
        }

        if (platformError) {
          warnings.push(
            "The product was created, but platform listings were not saved. Edit the item later to attach platforms."
          );
        }
      }

      devLog("Refreshing Master Inventory...");
      await onCreated();
      devLog("✓ Inventory refreshed");

      if (warnings.length > 0) {
        setSuccessMessage(
          `"${product.item_name}" was added to inventory. ${warnings.join(
            " "
          )} You can finish this from Edit Item later.`
        );
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  if (successMessage) {
    return (
      <div className="detail-panel-overlay" onClick={onClose}>
        <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="detail-panel-header">
            <h2>Add Item</h2>
            <button className="detail-panel-close" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="detail-panel-body">
            <p className="form-success">{successMessage}</p>
            <button
              className="inventory-add-button form-save-button"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel-header">
          <h2>Add Item</h2>
          <button className="detail-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="detail-panel-body">
          <label className="form-field">
            <span className="detail-label">Product Link</span>
            <input
              className="form-input"
              type="text"
              placeholder="Paste a product link to auto-fill this form"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
            />
            {lookupStatus === "loading" && (
              <span className="lookup-status">Looking up product...</span>
            )}
            {lookupStatus === "done" && lookupMessage && (
              <span className="lookup-status">{lookupMessage}</span>
            )}
          </label>

          <div className="detail-divider" />

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
            <span className="detail-label">Primary Image</span>

            {primaryImagePreviewUrl && (
              <div className="image-manager-item">
                <img
                  src={primaryImagePreviewUrl}
                  alt=""
                  className="image-manager-thumb"
                />
                <button
                  type="button"
                  className="image-manager-action image-manager-delete"
                  onClick={() => setPrimaryImage(null)}
                >
                  Remove
                </button>
              </div>
            )}

            <input
              className="form-input"
              type="file"
              accept="image/*"
              onChange={(e) => setPrimaryImage(e.target.files?.[0] || null)}
            />
          </div>

          <label className="form-field">
            <span className="detail-label">Additional Images</span>
            <input
              className="form-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setAdditionalImages(Array.from(e.target.files || []))
              }
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
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
