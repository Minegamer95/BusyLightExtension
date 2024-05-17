window.onload = async () => {
    // Permission
    // Popup window can't open a permission prompt so we have to use a page instead.
    // This issue is being tracked by crbug.com/1349183.
    document.getElementById('grantPermissionButton').onclick = async () => {
        await navigator.hid.requestDevice({
            filters: [],
            userGesture: true
          });
    };
  };
  