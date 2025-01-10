const User = require('../models/userModel');

// Create new user(s) - handles both single and bulk creation
exports.createUser = async (req, res) => {
  try {
    const data = req.body;
    
    if (Array.isArray(data)) {
      // Check for duplicate emails or mobile numbers in the array
      const emails = data.map(user => user.email);
      const mobiles = data.map(user => user.mobile);
      
      // Check for duplicates within the array itself
      if (new Set(emails).size !== emails.length) {
        return res.status(400).json({ 
          message: 'Duplicate email addresses found in the input data'
        });
      }
      
      if (new Set(mobiles).size !== mobiles.length) {
        return res.status(400).json({ 
          message: 'Duplicate mobile numbers found in the input data'
        });
      }
      
      // Check for existing emails or mobiles in database
      const existingEmail = await User.findOne({ email: { $in: emails } });
      if (existingEmail) {
        return res.status(400).json({ 
          message: `Email ${existingEmail.email} already exists`
        });
      }
      
      const existingMobile = await User.findOne({ mobile: { $in: mobiles } });
      if (existingMobile) {
        return res.status(400).json({ 
          message: `Mobile number ${existingMobile.mobile} already exists`
        });
      }
      
      // Bulk creation
      const users = await User.insertMany(data, { ordered: false });
      res.status(201).json({
        message: 'Bulk users created successfully',
        count: users.length,
        users: users
      });
    } else {
      // Single user creation
      const { name, email, mobile } = data;
      
      // Check if user already exists with email
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ 
          message: 'User with this email already exists'
        });
      }
      
      // Check if user already exists with mobile
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({ 
          message: 'User with this mobile number already exists'
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        mobile
      });

      const savedUser = await user.save();
      res.status(201).json(savedUser);
    }
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Duplicate ${field} found in bulk creation`,
        error: error.message 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    
    // Check if email exists for other users
    if (email) {
      const existingEmail = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmail) {
        return res.status(400).json({ 
          message: 'Email already exists for another user'
        });
      }
    }
    
    // Check if mobile exists for other users
    if (mobile) {
      const existingMobile = await User.findOne({ 
        mobile, 
        _id: { $ne: req.params.id } 
      });
      if (existingMobile) {
        return res.status(400).json({ 
          message: 'Mobile number already exists for another user'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `This ${field} is already in use`
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all users
exports.deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({ 
      message: 'All users deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this new search function
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a search pattern that's case-insensitive
    const searchPattern = new RegExp(query, 'i');

    // Search in name, email, and mobile fields
    const users = await User.find({
      $or: [
        { name: searchPattern },
        { email: searchPattern },
        { mobile: searchPattern }
      ]
    });

    res.status(200).json({
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import users from JSON file
exports.importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a JSON file' });
    }

    // Parse JSON data from the uploaded file
    let users;
    try {
      const jsonString = req.file.buffer.toString();
      users = JSON.parse(jsonString);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON file' });
    }

    // Ensure users is an array
    if (!Array.isArray(users)) {
      users = [users];
    }

    // Validate the data structure
    const isValidData = users.every(user => 
      user.name && user.email && user.mobile
    );

    if (!isValidData) {
      return res.status(400).json({ 
        message: 'Invalid data structure. Each user must have name, email, and mobile'
      });
    }

    // Find duplicates within the input file
    const duplicates = {
      emails: findDuplicates(users.map(user => user.email)),
      mobiles: findDuplicates(users.map(user => user.mobile))
    };

    // Find existing records in database
    const existingRecords = {
      emails: [],
      mobiles: []
    };

    // Check each email and mobile in database
    for (const email of new Set(users.map(user => user.email))) {
      const existing = await User.findOne({ email });
      if (existing) {
        existingRecords.emails.push({
          value: email,
          existingUser: existing
        });
      }
    }

    for (const mobile of new Set(users.map(user => user.mobile))) {
      const existing = await User.findOne({ mobile });
      if (existing) {
        existingRecords.mobiles.push({
          value: mobile,
          existingUser: existing
        });
      }
    }

    // If there are any duplicates or existing records, return detailed report
    if (duplicates.emails.length > 0 || 
        duplicates.mobiles.length > 0 || 
        existingRecords.emails.length > 0 || 
        existingRecords.mobiles.length > 0) {
      
      const report = {
        message: 'Cannot import users due to duplicates',
        duplicatesInFile: {
          emails: duplicates.emails.map(email => ({
            value: email,
            entries: users.filter(user => user.email === email)
          })),
          mobiles: duplicates.mobiles.map(mobile => ({
            value: mobile,
            entries: users.filter(user => user.mobile === mobile)
          }))
        },
        existingInDatabase: {
          emails: existingRecords.emails,
          mobiles: existingRecords.mobiles
        }
      };

      return res.status(400).json(report);
    }

    // If no duplicates, proceed with import
    const importedUsers = await User.insertMany(users, { ordered: false });
    
    res.status(201).json({
      message: 'Users imported successfully',
      count: importedUsers.length,
      users: importedUsers
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Duplicate ${field} found during import`,
        error: error.message 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Helper function to find duplicates in an array
function findDuplicates(arr) {
  return arr.filter((item, index) => arr.indexOf(item) !== index)
    .filter((item, index, self) => self.indexOf(item) === index); // Get unique duplicates
} 