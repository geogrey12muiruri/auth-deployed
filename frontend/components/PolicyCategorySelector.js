const PolicyCategorySelector = ({ onChange }) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          name="category"
          className="w-full border px-3 py-2 rounded"
          onChange={onChange}
        >
          <option value="General Policy">General Policy</option>
          <option value="HR Policy">HR Policy</option>
          <option value="Academic Policy">Academic Policy</option>
          <option value="Research Policy">Research Policy</option>
        </select>
      </div>
    );
  };
  
  export default PolicyCategorySelector;
  