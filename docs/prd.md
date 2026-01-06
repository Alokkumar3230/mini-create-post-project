# Mini Social Post Application Requirements Document

## 1. Application Overview

### 1.1 Application Name
Mini Social Post Application

### 1.2 Application Description
A simple social media platform where users can create accounts, share posts (text or images), and interact through likes and comments. The design is inspired by the Social Page in the TaskPlanet app.

## 2. Core Features

### 2.1 Account Management
- User signup functionality using email and password
- User login functionality using email and password

### 2.2 Post Creation
- Users can create posts containing text, image, or both
- At least one content type (text or image) must be present in each post
- Neither text nor image is individually mandatory

### 2.3 Public Feed
- Display all posts from all users in a central feed
- Each post displays:
  - Username of the post creator
  - Post content (text and/or image)
  - Total like count
  - Total comment count

### 2.4 Engagement Features
- Users can like any post
- Users can comment on any post
- UI updates instantly to reflect likes and comments

## 3. Technical Requirements

### 3.1 Technology Stack
- Frontend: React.js or React Native CLI
- Backend: Node.js with Express
- Database: MongoDB

### 3.2 Database Structure
- Use only two collections: users and posts
- Post schema must store usernames of users who liked or commented

### 3.3 Styling
- Use Material UI (MUI), React Bootstrap, or basic CSS
- Do not use TailwindCSS

### 3.4 Deployment
- Frontend hosting: Vercel or Netlify
- Backend hosting: Render
- Database hosting: MongoDB Atlas

### 3.5 GitHub Repository
- Public repository with separate folders for frontend and backend

## 4. Additional Requirements

### 4.1 Performance Optimization
- Implement efficient pagination logic for the feed

### 4.2 UI/UX Standards
- Responsive design across different devices
- Clean and modern user interface