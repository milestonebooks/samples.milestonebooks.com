// [2018-05-16] from <https://mathiasbynens.be/notes/localstorage-pattern>

const storageClient = (function() {
  const uid = +(new Date()) + '';
  let storage;
  let result;
  try {
    (storage = window.localStorage).setItem(uid, uid);
    result = storage.getItem(uid) === uid;
    storage.removeItem(uid);
    return result && storage;
  } catch (exception) {}
}());

export default storageClient;
