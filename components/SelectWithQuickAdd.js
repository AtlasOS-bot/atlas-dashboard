export default function SelectWithQuickAdd({
  value,
  onChange,
  options,
  onAdd,
  disabled,
  placeholder = "—",
}) {
  return (
    <div className="dropdown-with-add">
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="quick-add-button"
        onClick={onAdd}
        disabled={disabled}
        title="Add new"
      >
        +
      </button>
    </div>
  );
}
