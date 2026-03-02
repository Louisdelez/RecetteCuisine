/**
 * State — État global réactif de l'application
 */

export const state = {
  tags: [],        // array of normalized tags for filtering
  search: '',
  viewId: null,
  editId: null,
  deleteTarget: null,  // { id } (recipe only)
};
