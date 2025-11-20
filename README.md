<h1>Project Name: BiteBuddy - Backend</h1>

<h2>Purpose:</h2>
    <p>
        This repository contains the backend of the <strong>BiteBuddy</strong>, a web application that allows users to manage foods, add foods, update foods and add to requested list operations. The backend is built using Node.js, Express, and MongoDB, with RESTful APIs for seamless integration with the frontend.
    </p>

<h2>Key features of the project:</h2>
    <ul>
        <li>
            <strong>Food Management</strong>
            <ul>
                <li>Add, update, and delete food records.</li>
                <li>Retrieve all available foods.</li>
                <li>Access the foods with sorting and limit options.</li>
                <li>Delete specific food by id</li>
                <li>Retrieve users requested food by user email.</li>
            </ul>
        </li>
        <li>
            <strong>User Authentication Integration</strong>
            <ul>
                <li>View website features and available foods.</li>
                <li>Create and manage personalized food list.</li>         
                <li>Routes designed to integrate with user authentication for personalized data retrieval.</li>         
            </ul>
        </li>
        <li>
            <strong>Search and Filtering</strong>
            <ul>
                <li>Powerful search options by Food Name</li>
                <li>Filter foods by food name or retrieve users requested foods based on email.</li>
            </ul>
        </li>
        <li>
            <strong>Database Operations</strong>
            <ul>
                <li>Optimized MongoDB queries with upsert and sorting capabilities.</li>
                <li>Ensure efficient data handling and avoid duplicate entries with query checks</li>
            </ul>
        </li>
    </ul>

<h2>API Endpoints: </h2>

<ul>
        <li>
            <strong>BiteBuddy Routes</strong>
            <ul>
                <li>_GET_ /available-foods - Fetch all foods available records.</li>
                <li>_GET_ /featured-foods - Fetch the filtered foods based on expire date  (limited to 6).</li>
                <li>_POST_ /add-foods - Add a new food.</li>
                <li>_PUT_ /add-foods - update a food by id.</li>  
                <li>_DELETE_ /available-foods/:id - Delete a specific food by ID.</li>   
                <li>_POST_ /manage-myfoods/:email - Fetch all foods for a user by email.</li>          
            </ul>
        </li>
        <li>
            <strong>NPM Packages Used</strong>
            <ul>
                <li>_express_ - Web framework for building RESTful APIs.</li>
                <li>_cors_ - Enable Cross-Origin Resource Sharing.</li>
                <li>_dotenv_ - Manage environment variables.</li>
                <li>_mongodb_ - MongoDB client for database operations.</li>
            </ul>
        </li>
    </ul>
