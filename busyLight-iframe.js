  window.onload = async () => {

    // Dialog
  let noDeviceDialog = document.getElementById('noDeviceDialog');

    document.getElementById('closeDialogButton').onclick = () => {
      noDeviceDialog.close();
    };
  
    if (!noDeviceDialog.open) {
        noDeviceDialog.showModal();
      }
    else
    noDeviceDialog.close();
      

  };
