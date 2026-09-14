import { useCurrentUser } from "../lib/currentUserContext";

// The list/card views show one "Quantity" number per item, unlike the
// detail panel which already breaks N/M/Shared/Total out separately. That
// single number should reflect whichever person is currently signed in;
// any other account (unmapped, or none) falls back to the existing
// combined total_quantity behavior, unchanged.
function displayedQuantity(product, person) {
  if (person === "N") return product.n_quantity;
  if (person === "M") return product.m_quantity;
  return product.total_quantity;
}

export default function InventoryTable({ products, onRowClick }) {
  const { person } = useCurrentUser();

  return (
    <>
      {/* Desktop table — unchanged, hidden on phones via CSS */}
      <div className="inventory-table-wrapper">
        <table className="inventory-table inventory-table-compact">
          <thead>
            <tr>
              <th></th>
              <th>Inventory ID</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Purchase Source</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const mainImage = (product.product_images || []).find(
                (img) => img.is_main
              );

              return (
                <tr
                  key={product.id}
                  className="inventory-row"
                  onClick={() => onRowClick(product)}
                >
                  <td className="inventory-thumb-cell">
                    {mainImage ? (
                      <img
                        src={mainImage.image_url}
                        alt={product.item_name}
                        className="inventory-thumb"
                      />
                    ) : (
                      <div className="inventory-thumb inventory-thumb-placeholder">
                        📦
                      </div>
                    )}
                  </td>
                  <td>{product.inventory_id}</td>
                  <td className="inventory-name-cell" title={product.item_name}>
                    {product.item_name}
                  </td>
                  <td>{displayedQuantity(product, person)}</td>
                  <td>
                    <span
                      className={
                        product.status === "Out of Stock"
                          ? "inventory-status inventory-status-out"
                          : "inventory-status inventory-status-in"
                      }
                    >
                      {product.status}
                    </span>
                  </td>
                  <td>{product.purchase_source?.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list — same data, only shown on phones via CSS */}
      <div className="inventory-card-list">
        {products.map((product) => {
          const mainImage = (product.product_images || []).find(
            (img) => img.is_main
          );

          return (
            <div
              key={product.id}
              className="inventory-card"
              onClick={() => onRowClick(product)}
            >
              <div className="inventory-card-thumb-cell">
                {mainImage ? (
                  <img
                    src={mainImage.image_url}
                    alt={product.item_name}
                    className="inventory-card-thumb"
                  />
                ) : (
                  <div className="inventory-card-thumb inventory-thumb-placeholder">
                    📦
                  </div>
                )}
              </div>

              <div className="inventory-card-body">
                <div className="inventory-card-title">{product.item_name}</div>
                <div className="inventory-card-id">{product.inventory_id}</div>

                <div className="inventory-card-meta">
                  <span
                    className={
                      product.status === "Out of Stock"
                        ? "inventory-status inventory-status-out"
                        : "inventory-status inventory-status-in"
                    }
                  >
                    {product.status}
                  </span>
                  <span className="inventory-card-qty">
                    Qty: {displayedQuantity(product, person)}
                  </span>
                </div>

                {product.purchase_source?.name && (
                  <div className="inventory-card-source">
                    {product.purchase_source.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
