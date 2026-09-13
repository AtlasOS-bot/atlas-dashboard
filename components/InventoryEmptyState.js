export default function InventoryEmptyState({ onAddItem }) {
  return (
    <div className="inventory-empty">
      <p className="inventory-empty-title">No items in your inventory yet.</p>
      <p className="inventory-empty-subtitle">
        Add your first product to start tracking stock, cost, and sales.
      </p>
      <button className="inventory-add-button" onClick={onAddItem}>
        + Add Item
      </button>
    </div>
  );
}
