function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toFixed(2)}`;
}

// Collapses a platform's N/M rows into one label. Legacy rows with no
// person (from before per-person tracking existed) are ignored here —
// they're not attributable to N or M, so they don't factor into who's
// listed, but they're never deleted either (see the migration).
function platformPeopleLabel(rows) {
  const hasN = rows.some((pp) => pp.person === "N");
  const hasM = rows.some((pp) => pp.person === "M");
  if (hasN && hasM) return "N + M";
  if (hasN) return "N";
  if (hasM) return "M";
  return "Not listed";
}

export default function InventoryDetailPanel({ product, onClose, onEdit }) {
  const images = product.product_images || [];
  const mainImage = images.find((img) => img.is_main);
  const additionalImages = images.filter((img) => !img.is_main);

  const platformRows = product.product_platforms || [];
  const platformSummaries = [];
  const seenPlatformIds = new Set();
  platformRows.forEach((pp) => {
    if (!pp.platform_id || seenPlatformIds.has(pp.platform_id)) return;
    seenPlatformIds.add(pp.platform_id);
    const rowsForPlatform = platformRows.filter(
      (row) => row.platform_id === pp.platform_id
    );
    platformSummaries.push({
      platformId: pp.platform_id,
      name: pp.platform?.name,
      label: platformPeopleLabel(rowsForPlatform),
    });
  });

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel-header">
          <h2>{product.item_name}</h2>
          <div className="detail-panel-header-actions">
            <button
              className="detail-panel-edit"
              onClick={() => onEdit(product)}
            >
              Edit
            </button>
            <button className="detail-panel-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {mainImage ? (
          <img
            src={mainImage.image_url}
            alt={product.item_name}
            className="detail-panel-image"
          />
        ) : (
          <div className="detail-panel-image detail-panel-image-placeholder">
            📦
          </div>
        )}

        {additionalImages.length > 0 && (
          <div className="image-manager-grid detail-panel-gallery">
            {additionalImages.map((image) => (
              <img
                key={image.id}
                src={image.image_url}
                alt=""
                className="image-manager-thumb"
              />
            ))}
          </div>
        )}

        <div className="detail-panel-body">
          <div className="detail-row">
            <span className="detail-label">Inventory ID</span>
            <span className="detail-value">{product.inventory_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Brand</span>
            <span className="detail-value">{product.brand?.name || "—"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Category</span>
            <span className="detail-value">{product.category?.name || "—"}</span>
          </div>

          <div className="detail-divider" />

          <div className="detail-row">
            <span className="detail-label">N Qty</span>
            <span className="detail-value">{product.n_quantity}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">M Qty</span>
            <span className="detail-value">{product.m_quantity}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Qty</span>
            <span className="detail-value">{product.total_quantity}</span>
          </div>

          <div className="detail-divider" />

          <div className="detail-row">
            <span className="detail-label">Cost Each</span>
            <span className="detail-value">
              {formatCurrency(product.cost_each)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Cost</span>
            <span className="detail-value">
              {formatCurrency(product.total_cost)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Market Price</span>
            <span className="detail-value">
              {formatCurrency(product.market_price)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Market Value</span>
            <span className="detail-value">
              {formatCurrency(product.total_market_value)}
            </span>
          </div>

          <div className="detail-divider" />

          <div className="detail-row">
            <span className="detail-label">Storage Location</span>
            <span className="detail-value">
              {product.storage_location?.name || "—"}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Purchase Source</span>
            <span className="detail-value">
              {product.purchase_source?.name || "—"}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Purchase Date</span>
            <span className="detail-value">{product.purchase_date || "—"}</span>
          </div>

          <div className="detail-divider" />

          <div className="detail-row-platforms">
            <span className="detail-label">Platforms</span>
            <div className="platform-summary-list">
              {platformSummaries.filter((p) => p.label !== "Not listed").length === 0 ? (
                <span className="platform-summary-muted">Not listed</span>
              ) : (
                platformSummaries
                  .filter((p) => p.label !== "Not listed")
                  .map((p) => (
                    <div key={p.platformId} className="platform-summary-row">
                      <span className="platform-summary-name">{p.name}</span>
                      <span className="platform-summary-people">{p.label}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {product.product_link && (
            <>
              <div className="detail-divider" />
              <div className="detail-row">
                <span className="detail-label">Product Link</span>
                <a
                  className="detail-value detail-link"
                  href={product.product_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original listing
                </a>
              </div>
            </>
          )}

          {product.notes && (
            <>
              <div className="detail-divider" />
              <div className="detail-row detail-row-notes">
                <span className="detail-label">Notes</span>
                <p className="detail-value">{product.notes}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
