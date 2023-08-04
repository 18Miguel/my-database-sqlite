const { Database } = require('sqlite3').verbose();
const { join } = require('path');

/**
 * @class A simple SQLite database wrapper for Node.js.
 */
class MyDatabase {
    static #DATABASE_FILE_PATH = join(__dirname, 'my_database.db');
    static #ALTER_OPERATION = {
        ADD: 'ADD',
        DROP: 'DROP'
    };
    #db = null;

    /**
     * @constructor Create a new instance of the database.
     * @param {string} [filePath] - The file path for the SQLite database file.
     */
    constructor(filePath) {
        this.#db = new Database(filePath || MyDatabase.DATABASE_FILE_PATH);
        // Enable foreign key constraints
        this.#db.run('PRAGMA foreign_keys = ON;', error => {
            if (error)
                console.error(error);
        });
    }

    /**
     * The default file path for the SQLite database file.
     */
    static get DatabaseFilePath() {
        return MyDatabase.#DATABASE_FILE_PATH;
    }
    
    /**
     * @enum {string} Enum representing the allowed operations for the alterTable method.
     */
    static get AlterOperation() {
        return MyDatabase.#ALTER_OPERATION;
    }

    /**
     * Create a table in the database.
     * @param {string} tableName - The name of the table.
     * @param {...string} columns - The column definitions.
     * @returns {Promise<void>} A promise that resolves when the table creation is successful and rejects if an error occurs.
     */
    createTable(tableName, ...columns) {
        return new Promise((resolve, reject) => {
            this.#db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`, error => {
                if (error)
                    reject(new Error(`${error}`));
                else
                    resolve();
            });
        });
    }

    /**
     * Drop an existing table from the database.
     * @param {string} tableName - The name of the table to be dropped.
     * @returns {Promise<void>} A promise that resolves when the table dropping is successful and rejects if an error occurs.
     */
    dropTable(tableName) {
        return new Promise((resolve, reject) => {
            this.#db.run(`DROP TABLE IF EXISTS ${tableName}`, error => {
                if (error)
                    reject(new Error(`${error}`));
                else
                    resolve();
            });
        });
    }

    /**
     * Alter an existing table by adding, dropping, or modifying columns.
     * @param {string} tableName - The name of the table to be altered.
     * @param {AlterOperation} operation - The operation to be performed.
     * Should be one of AlterOperation.ADD or AlterOperation.DROP.
     * @param {...string} columns - An array of column definitions.
     * @returns {Promise<void>} A promise that resolves when the alteration is successful and rejects if an error occurs.
     * @throws {Error} If an invalid operation is provided.
     */
    alterTable(tableName, operation, ...columns) {
        const allowedOperations = Object.values(MyDatabase.AlterOperation);
        if (!allowedOperations.includes(operation))
            throw new Error(`Invalid operation. The operation must be one of: ${allowedOperations.join(', ')}`);

        if (columns && columns.length > 0) {
            const queries = columns.map(columnDef => `ALTER TABLE ${tableName} ${operation} COLUMN ${columnDef}`);
            const promises = queries.map(query => {
                return new Promise((resolve, reject) => {
                    this.#db.run(query, error => {
                        if (error)
                            reject(new Error(`${error}`));
                        else
                            resolve();
                    });
                });
            });

            return Promise.all(promises);
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Insert one or more rows into the table.
     * @param {string} tableName - The name of the table.
     * @param {...{label: value}} rows - The row data or an array of row data to be inserted.
     * @returns {Promise<void>} A promise that resolves when the insertion is successful and rejects if an error occurs.
     */
    insertRows(tableName, ...rows) {
        const promises = rows.map(row => {
            const keys = Object.keys(row);
            const values = Object.values(row);
            const query = `INSERT INTO ${tableName} (${keys.join(', ')})` +
                `VALUES (${keys.map(() => '?').join(', ')})`;

            return new Promise((resolve, reject) => {
                this.#db.run(query, values, error => {
                    if (error)
                        reject(new Error(`${error}`));
                    else
                        resolve();
                });
            });
        });

        return Promise.all(promises);
    }  

    /**
     * Update rows in the table based on a condition.
     * @param {string} tableName - The name of the table.
     * @param {Object} row - The updated row data.
     * @param {string} [condition] - The update condition.
     * @returns {Promise<void>} A promise that resolves when the update is successful and rejects if an error occurs.
     */
    updateRow(tableName, row, condition) {
        const sets = Object.keys(row).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(row);
        const query = `UPDATE ${tableName} SET ${sets} ${condition || ''}`;

        return new Promise((resolve, reject) => {
            this.#db.run(query, values, error => {
                if (error)
                    reject(new Error(`${error}`));
                else
                    resolve();
            });
        });
    }

    /**
     * Delete rows from the table based on a condition.
     * @param {string} tableName - The name of the table.
     * @param {string} [condition] - The delete condition.
     * @returns {Promise<void>} A promise that resolves when the deletion is successful and rejects if an error occurs.
     */
    deleteRows(tableName, condition) {
        return new Promise((resolve, reject) => {
            this.#db.run(`DELETE FROM ${tableName} ${condition || ''}`, error => {
                if (error)
                    reject(new Error(`${error}`));
                else
                    resolve();
            });
        });
    }

    /**
     * Retrieve rows from the table based on a condition.
     * @param {string} tableName - The name of the table.
     * @param {string} [condition] - The select condition.
     * @returns {Promise<Object[]>} - A promise that resolves with the retrieved rows.
     */
    selectRows(tableName, condition) {
        const query = `SELECT * FROM ${tableName} ${condition || ''}`;

        return new Promise((resolve, reject) => {
            this.#db.all(query, (error, rows) => {
                if (error)
                    reject(error);
                else
                    resolve(rows);
            });
        });
    }

    /**
     * Get the names of all the tables in the database along with their respective columns.
     * @returns {Promise<Promise<{ tableName: string, columns: { name: string, type: string }[] }[]>} - A promise that resolves with an array of objects representing each table and its columns.
     */    
    async getAllTables() {
        return await new Promise((resolve, reject) => {
            this.#db.all('SELECT * FROM sqlite_master WHERE type="table"', async (error, tables) => {
                if (error)
                    reject(error);

                const tablePromises = tables.map(async table => {
                    const tableName = table.name;
                    const columns = await this.getTableColumns(tableName);
                    return { tableName, columns };
                });
                resolve(await Promise.all(tablePromises));
            });
        });
    }

    /**
     * Get the columns of a specific table.
     * @param {string} tableName - The name of the table.
     * @returns {Promise<{ name: string, type: string }[]>} - A promise that resolves with an array of column names for the specified table.
     */
    getTableColumns(tableName) {
        return new Promise((resolve, reject) => {
            this.#db.all(`PRAGMA table_info(${tableName});`, (error, columns) => {
                if (error)
                    reject(error);
                else
                    resolve(columns.map(column => { return { name: column.name, type: column.type }; }));
            });
        });
    }

    /**
     * Get all data from all tables in the database.
     * @returns {Promise<Object>} A promise that resolves with an object representing all the data from all tables.
     */
    async getAllData() {
        const allData = {};
        const tables = await this.getAllTables();

        return new Promise(async (resolve, reject) => {
            for (const table of tables) {
                const tableName = table.tableName;
                await this.selectRows(tableName)
                    .then(rows => allData[tableName] = rows)
                    .catch(error => reject(error));
            }
            
            resolve(allData);
        });
    }

    /**
     * Close the database connection.
     */
    close() {
        this.#db.close();
    }
}

module.exports = MyDatabase;
