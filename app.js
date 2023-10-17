//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const date = require(__dirname + "/date.js");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');



let lists = []
const getAllLists =  function (req, res, next){
  List.find({},{_id: 0, name: 1}).then(result => {
    result.forEach((list) => {
      if(!lists.includes(list.name)){
        console.log(`Adding ${list.name} to lists`)
        lists.push(list.name)
      }
    })
    console.log("Called 1")
    console.log("lists: " + lists)
  }).catch(err => {
    console.log(err)
  })
  next()
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(getAllLists)


// Create a connection to mongo db
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true})
// mongoose.connect("mongodb+srv://galvelistious37:eAEbKLKgumd9orA8@cluster0.uoierrh.mongodb.net/todolistDB", {useNewUrlParser: true})

// Create the item schema
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name cannot be empty"]
  }
})

// Create the mongoose model with Singular Collection name
// and schema as parameters
const Item = mongoose.model("Item", itemsSchema)

// Create mongo db documents (mongo version of db records)
const item1 = new Item({
  name: "Default Task"
})

// Put all items in an array
const defaultItems = [item1]

// Create the list schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

// Create the list model
const List = mongoose.model("List", listSchema)

// Load root - default documents
app.get("/", function(req, res) {
  const day = date.getDate();
  // Get all documents
  Item.find()
    .then(result => {
      if(result.length === 0){
        // If not documents, add default document and load the page again
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Default documents have been added to the collection")
          })
          .catch(err => {
            console.log(err)
          })
          res.redirect("/")
      } else {
        // Render list.ejs with all documents
        res.render("list", {listTitle: "Today", allLists: lists, newListItems: result})
      }
    })
    .catch(err => {console.log(err)})
  
});

// Get custom documents based on url parameter
app.get("/:customListName", (req, res) => {
  const day = date.getDate();
  const customListName = _.capitalize(req.params.customListName)
  
  // Check DB and see if there is a collection for customListName
  List.findOne({name: customListName})
    .then((result) => {
      if(result){
        // If there is a collection, render list.ejs with collectionList documents
        res.render("list", {listTitle: result.name, allLists: lists, newListItems: result.items})
      } else {
        // No collection, create one and add a default task. Refresh the page
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect("/"+customListName)
      }
    })
    .catch(err => {
      console.log(err)
    })
})

app.post("/newList", (req, res) => {
  console.log(req.body.newList)
  res.redirect("/"+req.body.newList)
})

// Get custom documents based on url parameter
app.post("/list", (req, res) => {
  const day = date.getDate();
  const customListName = _.capitalize(req.body.ddList)
  
  // Check DB and see if there is a collection for customListName
  List.findOne({name: customListName})
    .then((result) => {
      if(result){
        // If there is a collection, render list.ejs with collectionList documents
        res.redirect("/"+customListName)
      } else {
        // No collection, create one and add a default task. Refresh the page
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect("/"+customListName)
      }
    })
    .catch(err => {
      console.log(err)
    })
})




// Post a new task to a collection
app.post("/", function(req, res){
  const listName = req.body.list

  if(listName === "Today"){
    // If collection = Today, add item to default list
    new Item({name: req.body.newItem}).save()
    res.redirect("/")
  } else {
    // Find the collection for listName
    List.findOne({name: listName})
      .then((result) => {
        // If collection exists, add new item to the result and load the /<collectionName> url
        result.items.push(new Item({name: req.body.newItem}))
        result.save()
        res.redirect("/"+listName)
      })
      .catch(err => {
        console.log(err)
      })
  }

});

// Delete item from collection
app.post("/delete", function(req, res){
  // Get item id from checkbox
  const checkedItem = req.body.checkBox
  // Get collection name from hidden input
  const hiddenListVal = req.body.hiddenListName

  if(hiddenListVal === "Today"){
    // Delete from default items list
    Item.findByIdAndRemove(checkedItem)
      .then(result =>{res.redirect("/")})
      .catch(err => {console.log(err)})
  } else {
    // Find the collections name
    List.findOneAndUpdate({name: hiddenListVal},
      {$pull: {items: {_id: checkedItem}}})
      .then(result => {
        console.log("Document removed from collection")
        res.redirect("/"+hiddenListVal)
      })
      .catch(err => {console.log(err)})
  }
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

