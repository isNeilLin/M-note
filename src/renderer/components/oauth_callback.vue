<template>
    <div></div>
</template>
<script>
import Evernote from 'evernote'
var client = new Evernote.Client({
    consumerKey: 'neillin',
    consumerSecret: '079c9ef6fd5872aa',
    sandbox: true, // change to false when you are ready to switch to production
    china: false,
})
export default {
  name: 'backGround',
  beforeCreate: function () {
    this.$Win.changePath(this)
  },
  mounted(){
    client.getAccessToken(localStorage.getItem('oauthToken'),
      localStorage.getItem('oauthTokenSecret'),
      req.query.oauth_verifier,
    function(error, oauthToken, oauthTokenSecret, results) {
      if (error) {
        // do your error handling
      } else {
        // oauthAccessToken is the token you need;
        var authenticatedClient = new Evernote.Client({
          token: oauthToken,
          sandbox: true,
          china: false,
        });
        var noteStore = authenticatedClient.getNoteStore();
        noteStore.listNotebooks().then(function(notebooks) {
          console.log(notebooks); // the user's notebooks!
        });
      }
    });
  }
}
</script>
<style>
</style>