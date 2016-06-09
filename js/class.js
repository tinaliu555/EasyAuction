class ImageDealer {
  constructor() {
    this._imgRoot = ImageDealer.REF.storage().ref();
    this._uploadTask;

  }
  uploadImage(imgFile, path){
    this._uploadTask = this._imgRoot.child("images/" + path ).put(imgFile);
  }
  uploadListener(progressM, completeM){
    this._uploadTask.on('state_changed',
    function (snapshot) {
      var uploadPro = snapshot.bytesTransferred / snapshot.totalBytes;
      progressM(uploadPro);
    },function (error) {
      alert(error.code);
    },function () {
      completeM();
    });
  }
  getImage(path,dom){
    this._imgRoot.child("images/"+path).getDownloadURL().then(function (url) {
      dom.css("background-image","url("+url+")");
    }).catch(function (error) {
      alert(error.code);
    });
  }
  deleteImage(path, dom){
    this._imgRoot.child("images/"+path).delete().then(function () {
      dom.css("background-image","url()");
    }).catch(function (error) {
      alert(error.code);
    })
  }
}

class Item {
  constructor(data, isSeller) {
    this._title = "Unknown";
    this._price = 0;
    this._sellerKey ="";
    this._sellerName = "Unknown";
    this._itemKey = "";
    this._isSeller = false;
    this._itemImg = new ImageDealer();
    this._domView;
    this._checkInputCreate(data, isSeller);
  }
  _checkInputCreate(data, isSeller){
    for (var variable in data) {
      switch (variable) {
        case "title":
          if (typeof data[variable] === "string" ) {
            this._title = data[variable];
          }
          break;
        case "price":
          if (typeof data[variable] === "number" ) {
            this._price = data[variable];
          }
          break;
        case "itemKey":
          if (typeof data[variable] === "string" ) {
            this._itemKey = data[variable];
          }
          break;
        case "seller":
          if (typeof data[variable] === "string" ) {
            this._sellerKey = data[variable];
          }
          break;
        case "sellerName":
          if (typeof data[variable] === "string" ) {
            this._sellerName = data[variable];
          }
          break;
      }
    }
    if (isSeller) {
      if (isSeller.uid == this._sellerKey) {
        this._isSeller= true;
      }
    }
    this._domView = this._createItem();
  }
  _createItem() {
    var picPart = this._createPic();
    var wordPart = this._createIntro();
    var itemView = $("<div>",{
      class: "sale-item",
    }).append(picPart).append(wordPart);
    return itemView;
  }
  _picBack() {
    var pixBa = $("<div>",{class: "pic"});
    var imgUrl = this._itemImg.getImage((this._sellerKey+"/"+this._itemKey+ "/01.jpg"),pixBa);
    return pixBa;
  }
  _createPic() {
    if (this._isSeller) {
      var picDom = this._picBack().append($("<div>",{class: "white-mask"}).append(
        $("<div>",{class: "option"}).append(
          $("<h6>", {text: "view", class: "view"})
        ).append($("<h6>", {text: "edit", class: "edit"}))
        )
        );
      }else {
        var picDom = this._picBack().append($("<div>",{class: "white-mask"}).append(
          $("<div>",{class: "option"}).append(
            $("<h6>",{text: "view", class:"view"})
          )
        ));
      }
    return picDom;
  }
  _createIntro() {
    // async data flow write this way
    var authDom = $("<a>",{href: "#", text: this._sellerName});
    var wordDom = $("<div>", {class: "word"}).append(
      $("<div>", {class: "name-price"}).append(
        $("<p>",{text: this._title})
      ).append(
        $("<p>",{text: '$' + this._price})
      )
    ).append(
      $("<div>", {class: "seller"}).append(
        authDom
      )
    );
    return wordDom;
  }
  get dom(){
    return this._domView;
  }
  get editBtn(){
    if (this._isSeller) {
      return this._domView.find(".edit");
    }else {
      return null;
    }
  }
  get viewBtn(){
    return this._domView.find(".view");
  }
  get itemKey(){
    if (this._itemKey != "") {
      return this._itemKey;
    }else {
      return "undefined";
    }
  }
  get sellerKey(){
    if (this._sellerKey != "") {
      return this._sellerKey;
    }else {
      return "undefined";
    }
  }
}

class UploadModal {
  constructor(targetModal) {
    this._modalDom = targetModal;
    this._loadPic = new ImageDealer();
    this._modalDom.on('hidden.bs.modal',this._clear);
    this._modalDom.find(".picBox").click(this._upload);
    this._currentItemKey="";
  }
  callImage(itemKey, sellerKey){
    this._loadPic.getImage((sellerKey+"/"+ itemKey+ "/01.jpg"), this._modalDom.find(".picBox"));
  }

  _clear(){
    $("#item-info :input").val("");
    $("#picData").val("");
    $("#ModalLabel").text("New Item");
    $("#editData").css("display","none");
    $("#removeData").css("display","none");
    $("#submitData").css("display","inline-block");
    $("#upload-modal .picBox").css("background-image", "url()")
    $("#progress").css("display","none");
    this._currentItemKey = "";
  }
  _upload(){
    $(this).siblings("#picData").trigger("click");
    $(this).siblings("#picData").change(function () {
      var thumbF = new FileReader();
      var imgF= $("#picData")[0].files[0];
      thumbF.readAsDataURL(imgF);
      thumbF.onloadend = (function (imge) {return function (e) {
          $(".picBox").css("background-image", "url("+ e.target.result +")");
      }})(imgF);
    });
  }
  submitPic(sellerKey){
    var root = this;
    this._loadPic.uploadImage($("#picData")[0].files[0], sellerKey+"/"+ this._currentItemKey+ "/01.jpg");
    this._loadPic.uploadListener(function (progress) {
      $("#progress").css("display","block");
    },function () {
      root._modalDom.modal("hide");
      $("#progress").css("display","none");
    })
  }
  editData(data){
    $("input:nth-of-type(1)").val(data.title);
    $("input:nth-of-type(2)").val(data.price);
    $("textarea").val(data.descrip);
    $("#ModalLabel").text("Edit Item");
    $("#submitData").css("display","none");
    $("#editData").css("display","inline-block");
    $("#removeData").css("display","inline-block");
    $("#upload-modal").modal("show");
    if (data.hasOwnProperty('itemKey')) {
      this._currentItemKey = data.itemKey;
    }
  }
  deletePic(sellerKey){
    this._loadPic.deleteImage((sellerKey+"/"+this._currentItemKey+"/01.jpg"),$("#picBox"));
    this._modalDom.modal("hide");
  }
  set itemKey(ite){
    if (typeof ite === "string") {
      this._currentItemKey = ite;
    }
  }
  get itemKey(){
    return this._currentItemKey;
  }

}

class ViewModal {
  constructor(targetModal) {
    this._modalDom = targetModal;
    this._loadPic = new ImageDealer();
    var root = this;
    this._modalDom.on('hidden.bs.modal',function () {
      root._clear()
    });
    this._itemKey="";
  }
  _clear(){
    this._modalDom.find(".title").text("Item Name");
    this._modalDom.find(".price").text("$ 0");
    this._modalDom.find(".descrip").text("");
    this._modalDom.find(".photo").css("background-image","url()");
    this._modalDom.find("#message").empty();
    firebase.database().ref("messages/"+this._itemKey).off();
  }
  callImage(itemKey,sellerKey){
    this._loadPic.getImage((sellerKey+ "/"+ itemKey+ "/01.jpg"), this._modalDom.find(".photo"));
    this._itemKey = itemKey;
  }
  writeData(data){
    this._modalDom.find(".title").text(data.title);
    this._modalDom.find(".price").text("$"+ data.price);
    this._modalDom.find(".descrip").text(data.descrip);
    this._modalDom.modal("show");
  }
}

class MessageBox {
  constructor(currentuser, itemKey) {
    this._hasLoggin = false;
    this._currUser ;
    this._dialogDom;
    this._inputBox;
    this._submitFunc;
    this._itemKey;
    this._dialogs =[];
    this._checkAndAdd(currentuser, itemKey);
  }
  _checkAndAdd(currentuser, itemKey){
    if (currentuser != null ) {
      this._currUser = currentuser
      this._hasLoggin =true;
    }
    if (itemKey != "undefined") {
      this._itemKey = itemKey;
    }
    this._dialogDom = $("<div>", {class: "messages"});
    if (this._hasLoggin) {
      var root = this;
      this._inputBox = $("<div>",{class:"media"}).append(
        $("<div>",{class: "media-left"}).append($("<img>",{class:"media-object", src: this._currUser.photoURL, alt: this._currUser.displayName}))
      ).append($("<div>",{class:"media-body"}).append($("<h4>",{class:"media-heading", text: this._currUser.displayName})).append($("<input>",{id:"dialog"})));

    }

  }
  addDialog(data){
    this._dialogs.push(data);
    this._dialogs.sort(function (a,b) {
      if(a.time> b.time){ return 1;}
      if (a.time< b.time) {return -1}
      return 0;
    });

    $(".messages").empty();
    for (var i = 0; i < this._dialogs.length; i++) {
      var sinDia = this._dialogs[i];
      this._addDialog(sinDia.message, sinDia.name, sinDia.picURL);
    }
  }
  _addDialog(message, userName, picURL){
    var sinDialog = $("<div>", {class: "media"}).append($("<div>",{class:"media-left"}).append($("<img>",{class: "media-object", src: picURL, alt: userName}))).append($("<div>",{class:"media-body"}));
    sinDialog.children(".media-body").append($("<h4>", {text:userName, class:"media-heading"})).append($("<p>",{text: message}));
    $(".messages").append(sinDialog);
  }
  refresh(){
    this._dialogDom.find(".messages").empty();
    this._dialogs= [];
  }
  set submitFunction(subFunc){
    this._submitFunc = subFunc;
    //console.log(this._submitFunc);
  }
  get dom(){
    return this._dialogDom;
  }
  get inputBox(){
    if (this._hasLoggin) {
      return this._inputBox;
    }else {
      return false;
    }
  }
  get userName(){
    return this._currUser.displayName;
  }
  get itemKey(){
    return this._itemKey;
  }
}
