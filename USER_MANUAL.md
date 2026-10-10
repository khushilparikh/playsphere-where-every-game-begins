# 📘 PlaySphere: The Complete User Manual

Welcome to **PlaySphere**! Whether you are an athlete looking for a weekend game, a venue owner wanting to manage your turf, or an organizer hosting a city-wide tournament, this platform has everything you need.

This manual is designed to be your step-by-step guide to mastering PlaySphere. It is written to be simple, detailed, and easy to understand for everyone.

---

## 📑 Table of Contents

1. **[For Beginners: Setting Up the App](#1-for-beginners-setting-up-the-app)**
2. **[Creating Your Account (Choosing Your Role)](#2-creating-your-account-choosing-your-role)**
3. **[👟 Player Guide: Playing & Booking](#3--player-guide-playing--booking)**
4. **[🏟️ Venue Owner Guide: Managing Turfs](#4--venue-owner-guide-managing-turfs)**
5. **[🏆 Tournament Organizer Guide](#5--tournament-organizer-guide)**
6. **[👟 Trainer & Academy Guide](#6--trainer--academy-guide)**
7. **[🛡️ Security: Setting up 2FA (Two-Factor Auth)](#7-️-security-setting-up-2fa)**
8. **[🎮 Gamification: XP & Badges](#8--gamification-xp--badges)**

---

## 1. For Beginners: Setting Up the App

If you are a developer or evaluator running this app on your local computer, follow these simple steps. If you are just a user browsing the website, you can skip this section!

### What you need installed:
- **Node.js** (Version 18 or higher)
- **PostgreSQL** (A database to store all the users and bookings)

### Step-by-Step Setup:
1. **Open your Terminal (Command Prompt)** and navigate to the project folder.
2. **Install the necessary files** by typing:
   ```bash
   npm install
   ```
3. **Set up your secret environment file:**
   - Copy the `.env.example` file and rename the copy to `.env`.
   - Open the `.env` file in a text editor.
   - Fill in your `DATABASE_URL` (this connects the app to your PostgreSQL database).
   - Fill in a `JWT_SECRET` (just type a long, random string of letters and numbers. This keeps passwords safe).
4. **Prepare the Database:**
   Run these two commands to create the tables inside your database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. **Start the App:**
   ```bash
   npm run dev
   ```
   🎉 **Success!** You can now open your web browser and go to `http://localhost:3000`.

---

## 2. Creating Your Account (Choosing Your Role)

When you click **Register** on the homepage, PlaySphere will ask you to choose a **Role**. *Choose carefully, as your entire dashboard will change based on this choice!*

- **Player:** Choose this if you just want to play, book venues, and join tournaments.
- **Venue Owner:** Choose this if you own a sports complex, turf, or court.
- **Tournament Organizer:** Choose this if you host leagues or knockout cups.
- **Trainer/Academy:** Choose this if you teach sports and want to manage students.
- **Admin:** The highest level of moderation. *(Note: To become an Admin, you must enter the secret `ADMIN_SIGNUP_CODE` found in the `.env` file during registration. Regular users cannot guess this).*

---

## 3. 👟 Player Guide: Playing & Booking

As a Player, your goal is to get out there and play. Here is how to use your features:

### How to Book a Venue
1. On the left sidebar, click on **Venues**.
2. Browse the list of available turfs and courts. You can see their hourly prices and ratings.
3. Click on a venue to view its details (like Google Maps location and amenities).
4. Select a **Date**, a **Time Slot**, and a **Sport**.
5. Click **Book Slot**. 
6. *Note:* Your booking is now in a "Pending" state. The Venue Owner will receive a notification to approve it. Once they click approve, it becomes "Confirmed"!

### How to Find Players or Join a Team
1. Go to the **Player Finder** tab on the left.
2. Here, you will see a bulletin board of teams looking for extra players.
3. If you want to join, click **Request to Join**. A message is sent directly to the team captain.
4. Alternatively, click **Create Post** to announce that *you* are looking for a team.

### How to Join a Tournament
1. First, you must be a **Team Captain**. Go to the **Teams** tab and create a team.
2. Next, go to the **Tournaments** tab.
3. Find an open tournament and click **Register Team**.
4. The system will automatically check if the tournament is full. If there is space, your team will be registered!

---

## 4. 🏟️ Venue Owner Guide: Managing Turfs

Your dashboard is built to track your revenue and manage bookings easily.

### How to Add Your Venue
1. Go to the **My Venues** tab on the sidebar.
2. Click **Add Venue**.
3. Fill in the details: Name, Area, Price per Hour, and the Sports you support.
4. *Pro Tip:* Add a full address. PlaySphere will automatically generate an embedded Google Map for players to find you!

### How to Manage Booking Requests
1. When a player books your turf, you will see a red notification bell at the top right.
2. Go to your **Dashboard**. 
3. Under "Recent Booking Requests", you will see the player's name, phone number, and requested time.
4. Click **Approve** to lock the slot in, or **Decline** if the turf is unavailable.
5. *Analytics:* Every time you approve a booking, your "Revenue This Month" chart will automatically update!

---

## 5. 🏆 Tournament Organizer Guide

Hosting a tournament has never been easier.

### How to Create a Tournament
1. Go to **My Tournaments** and click **Create Tournament**.
2. Set your rules: Name, Sport, Entry Fee, and the Maximum Team Capacity (e.g., 16 teams).
3. Once created, players can start registering.

### How to Manage Live Scores
1. Go to the details page of your active tournament.
2. Navigate to the **Fixtures & Scores** tab.
3. You will see a list of matches. Click **Update Score** next to a match.
4. Enter the new score (e.g., Team A: 2, Team B: 1).
5. **Magic Feature:** The moment you click Save, the score will instantly update on the screens of every player currently watching the app, without them needing to refresh the page! (Powered by WebSockets).

---

## 6. 👟 Trainer & Academy Guide

If you are a coach, this is how you manage your students.

### Setting Up Your Profile
1. Go to **Trainer Profile**.
2. Add your Experience (e.g., "10 Years"), Price per Session, and Specializations.
3. You can even upload a short **Intro Video** so students can see your coaching style.

### Managing Batches
1. Go to **My Batches**.
2. Click **Create Batch** (e.g., "Under-15 Evening Football").
3. Set the days (e.g., Mon/Wed/Fri) and the time.
4. As students request to join you, you can assign them directly to these batches to keep attendance organized.

---

## 7. 🛡️ Security: Setting up 2FA (Two-Factor Auth)

To keep your account extra safe from hackers, you can enable 2FA.

1. Click on your **Profile Picture** in the top right corner and select **Settings**.
2. Scroll down to the **Security** section and click **Enable 2FA**.
3. A QR Code will appear on your screen.
4. Open an Authenticator App on your phone (like *Google Authenticator* or *Authy*) and scan the QR Code.
5. The app will give you a 6-digit number. Type it into PlaySphere and click Verify.
6. **Done!** Next time you log in, after typing your password, PlaySphere will ask you for the 6-digit code from your phone.

---

## 8. 🎮 Gamification: XP & Badges

PlaySphere rewards you for being active!

- **Earning XP (Experience Points):** 
  - Every time you book a venue, you earn **+10 XP**.
  - Every time you register for a tournament, you earn **+15 XP**.
- **Leveling Up:** 
  - As you earn XP, your level goes up (e.g., Level 1 $\rightarrow$ Level 2). Your level is displayed next to your name on the Community Feed.
- **Badges:** 
  - Complete special milestones (like "First Booking" or "Tournament Veteran") to unlock shiny badges on your public profile!

---
*Thank you for using PlaySphere! If you encounter technical errors, please refer to the `BACKEND_GUIDE.md` file for API troubleshooting.*
