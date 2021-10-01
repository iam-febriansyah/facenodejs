module.exports = (sequelize, Sequelize) => {
    const UsersSmarterp = sequelize.define("users_smarterp", {
        user_id: {
            type: Sequelize.STRING,
            primaryKey: true,
            autoIncrement: false,
            allowNull: false
        },
        staff_id: {
            type: Sequelize.STRING,
            allowNull: false,

        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        email: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        facedata: {
            type: Sequelize.TEXT,
            allowNull: true
        },
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'users_smarterp'

    });

    return UsersSmarterp;
};