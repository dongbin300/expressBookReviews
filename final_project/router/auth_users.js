const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
}

regd_users.post("/login", (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

regd_users.put("/auth/review/:isbn", (req, res) => {
    try {
        const requestedIsbn = req.params.isbn;
        const reviewText = req.query.review;
        const username = req.session.authorization.username;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const book = books[requestedIsbn];

        if (book) {
            book.reviews[username] = reviewText;
            res.json({ message: "Review added/modified successfully" });
        } else {
            res.status(404).json({ message: "Book not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding/modifying review" });
    }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    try {
        const requestedIsbn = req.params.isbn;
        const username = req.session.authorization.username;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const book = books[requestedIsbn];

        if (book) {
            if (book.reviews[username]) {
                delete book.reviews[username];
                res.json({ message: "Review deleted successfully" });
            } else {
                res.status(404).json({ message: "Review not found" });
            }
        } else {
            res.status(404).json({ message: "Book not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting review" });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
