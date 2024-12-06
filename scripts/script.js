/*
 Name: Akash Mannil
 File Name: scripts.js
 Date: December 04, 2024
*/

// Hamburger menu Function
function hamburger() {
    var menu = document.getElementById("menu-links");
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}