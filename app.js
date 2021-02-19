const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname + "/public"));

const url = "mongodb+srv://admin-alejandro:test123@projects.fn4fi.mongodb.net/todolistDB";
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "Hit the checkbox to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {
    let day = date.getDate();
    // you need a views folder
    Item.find({}, (err, items) => {
        if (err) {
            console.log(err);
        } else {
            if (items.length === 0) {
                Item.insertMany(defaultItems, (err) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Successfully added default items");
                    }
                });
                res.redirect("/");
            }
            res.render("list", {
                listTitle: day,
                items: items
            });
        }
    })

});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listTitle = req.body.list;
    const day = date.getDate();
    const newItem = new Item({
        name: itemName
    });
    if (listTitle === day) {
        console.log("added new item")
        newItem.save().catch(err => {
            console.error(err);
        });
        res.redirect("/");
    } else {
        List.findOne({
            name: listTitle
        }, (err, foundList) => {
            foundList.items.push(newItem);
            foundList.save().catch(err => {
                console.error(err);
            });
        })
        res.redirect("/" + listTitle)
    }
});

app.post("/delete", (req, res) => {
    const checkItemId = req.body.checkbox;
    const listName = req.body.listName;
    const day = date.getDate();
    if (listName === day) {
        Item.findByIdAndDelete(checkItemId, err => {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkItemId
                }
            }
        }, (err, foundList) => {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});

app.get("/:list", (req, res) => {
    const customListName = _.capitalize(req.params.list);
    List.findOne({
        name: customListName
    }, (err, result) => {
        if (!err) {
            if (!result) {
                // create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save().catch(err => {
                    console.error(err);
                });
                res.render("list", {
                    listTitle: customListName,
                    items: defaultItems
                });
            } else {
                res.render("list", {
                    listTitle: result.name,
                    items: result.items
                });
            }
        }
    });
});


app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});