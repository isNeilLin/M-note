export default {
  content: function(state){
    return state.curFile ? state.curFile.content : '';
  }
}