//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Create a connection to mongo db
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true})

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

app.get("/", function(req, res) {
  const day = date.getDate();
  Item.find()
    .then(result => {
      if(result.length === 0){
        // Add the documents to the collection
        // (save the records to the table)
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Default documents have been added to the collection")
          })
          .catch(err => {
            console.log(err)
          })
          res.redirect("/")
      } else {
        res.render("list", {listTitle: day, newListItems: result})
      }
    })
    .catch(err => {console.log(err)})
});

app.get("/:customListName", (req, res) => {
  const day = date.getDate();
  const customListName = req.params.customListName
  
  List.findOne({name: customListName})
    .then((result) => {
      if(result){
        res.render("list", {listTitle: result.name, newListItems: result.items})
      } else {
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

app.post("/", function(req, res){

  const listName = req.body.list
  console.log(listName)

  

  List.findOne({name: listName})
    .then((result) => {
      if(result){
        result.items.push(new Item({name: req.body.newItem}))
        result.save()
        res.redirect("/"+listName)
      } else {
        new Item({name: req.body.newItem}).save()
        res.redirect("/")
      }
    })

  // new Item({
  //   name: req.body.newItem
  // }).save()

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkBox
  console.log(checkedItem)
  Item.findByIdAndRemove(checkedItem)
  .then(result =>{
    res.redirect("/")
  })
  .catch(err => {
    console.log(err)
  })
})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
