// const { Sequelize, Model, DataTypes } = require('sequelize');
// const sequelize = new Sequelize('sqlite::memory:');

// class User extends Model {}
// User.init({
//   // Model attributes are defined here
//   firstName: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   lastName: {
//     type: DataTypes.STRING
//     // allowNull defaults to true
//   }
// }, {
//   // Other model options go here
//   sequelize, // We need to pass the connection instance
//   modelName: 'User' // We need to choose the model name
// });

// // `sequelize.define` also returns the model
// console.log(User === sequelize.models.User); // true

// (async () => {
//   await sequelize.sync();
//   const jane = await User.create({ firstName: "Jane", lastName: "Doe" });
//   console.log(jane.toJSON());
// })();