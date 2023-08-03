# My Database SQLite

A simple SQLite database wrapper for Node.js.

## Installation

```shell
npm install https://github.com/18Miguel/my-database-sqlite
```

## Usage

Here's an example of how to use My Database SQLite:

```javascript
const MyDatabase = require('my-database-sqlite');

async function example() {
    const UserTable = 'users', DepartmentTable = 'departments';
    const db = new MyDatabase(MyDatabase.DatabaseFilePath);

    try {
        await db.createTable(UserTable, 'id INTEGER PRIMARY KEY', 'name varchar(255)', 'age INTEGER');
        await db.createTable(DepartmentTable, 'id INTEGER PRIMARY KEY', 'name varchar(255)');
        await db.createTable(`${DepartmentTable}_${UserTable}`,
            'department_id INTEGER NOT NULL',
            'user_id INTEGER NOT NULL',
            'PRIMARY KEY (department_id, user_id)',
            `FOREIGN KEY (department_id) REFERENCES ${DepartmentTable}(id) ON DELETE CASCADE`,
            `FOREIGN KEY (user_id) REFERENCES ${UserTable}(id) ON DELETE CASCADE`);

        const allTables = await db.getAllTables();
        console.log('All Tables:', allTables.map(table => JSON.stringify(table)));

        await db.insertRows(UserTable, { name: 'John Doe', age: 30 }, { name: 'Jane Smith', age: 25 });
        await db.insertRows(DepartmentTable, { name: 'boss' });

        await db.updateRow(UserTable, { age: 31 }, 'WHERE name = "John Doe"');
        console.log('Updated Users:', await db.selectRows(UserTable));

        await db.insertRows(`${DepartmentTable}_${UserTable}`, { department_id: 1, user_id: 1 });
        await db.insertRows(`${DepartmentTable}_${UserTable}`, { department_id: 1, user_id: 2 });
        console.log(`Table "${DepartmentTable}_${UserTable}":`, await db.selectRows(`${DepartmentTable}_${UserTable}`));

        await db.deleteRows(UserTable, 'WHERE name = "Jane Smith"');

        await db.dropTable(UserTable);

    } catch (error) {
        console.error('Error:', error);

    } finally {
        db.close();
    }
}

example();
```

## API

### Constructor

#### `new MyDatabase(filePath?: string)`

Create a new instance of the database. The optional `filePath` parameter allows you to specify the file path for the SQLite database file. If not provided, an in-memory database will be used.

- `filePath` (string?): The file path for the SQLite database file.

##
### Properties

#### `MyDatabase.DatabaseFilePath`

The default file path for the SQLite database file.

- Returns: `string` - The default file path for the SQLite database file.

#### `MyDatabase.AlterOperation`

Enum representing the allowed operations for the `alterTable` method.

- Returns: `enum` - Enum representing the allowed operations for the `alterTable` method.

##
### Methods

#### `createTable(tableName: string, ...columns: string[]): Promise<void>`

Create a table in the database with the specified table name and column definitions.

- `tableName` (string): The name of the table.
- `...columns` (string[]): The column definitions.
- Returns: `Promise<void>` - A promise that resolves when the table creation is successful and rejects if an error occurs.

#### `dropTable(tableName: string): Promise<void>`

Drop an existing table from the database based on the given table name.

- `tableName` (string): The name of the table to be dropped.
- Returns: `Promise<void>` - A promise that resolves when the table dropping is successful and rejects if an error occurs.

#### `alterTable(tableName: string, operation: MyDatabase.AlterOperation, ...columns: string[]): Promise<void>`

Alter an existing table by adding, dropping, or modifying columns.

- `tableName` (string): The name of the table to be altered.
- `operation` (MyDatabase.AlterOperation): The operation to be performed. Should be one of `MyDatabase.AlterOperation.ADD` or `MyDatabase.AlterOperation.DROP`.
- `...columns` (string[]): An array of column definitions.
- Returns: `Promise<void>` - A promise that resolves when the alteration is successful and rejects if an error occurs.
- Throws: `Error` - If an invalid operation is provided.

#### `insertRows(tableName: string, ...rows: { [key: string]: any }[]): Promise<void>`

Insert one or more rows into a table.

- `tableName` (string): The name of the table.
- `...rows` ({ [key: string]: any }[]): The row data or an array of row data to be inserted.
- Returns: `Promise<void>` - A promise that resolves when the insertion is successful and rejects if an error occurs.

#### `updateRow(tableName: string, row: { [key: string]: any }, condition?: string): Promise<void>`

Update rows in the table based on a condition.

- `tableName` (string): The name of the table.
- `row` ({ [key: string]: any }): The updated row data.
- `condition` (string?) (Optional): The update condition.
- Returns: `Promise<void>` - A promise that resolves when the update is successful and rejects if an error occurs.

#### `deleteRows(tableName: string, condition?: string): Promise<void>`

Delete rows from the table based on a condition.

- `tableName` (string): The name of the table.
- `condition` (string?) (Optional): The delete condition.
- Returns: `Promise<void>` - A promise that resolves when the deletion is successful and rejects if an error occurs.

#### `selectRows(tableName: string, condition?: string): Promise<Object[]>`

Retrieve rows from the table based on a condition.

- `tableName` (string): The name of the table.
- `condition` (string?) (Optional): The select condition.
- Returns: `Promise<Object[]>` - A promise that resolves with the retrieved rows.

#### `getAllTables(): Promise<{ tableName: string, columns: { name: string, type: string }[] }[]>`

Get the names of all the tables in the database along with their respective columns.

- Returns: `Promise<{ tableName: string, columns: { name: string, type: string }[] }[]>` - A promise that resolves with an array of objects representing each table and its columns.

#### `getTableColumns(tableName: string): Promise<{ name: string, type: string }[]>`

Get the columns of a specific table.

- `tableName` (string): The name of the table.
- Returns: `Promise<{ name: string, type: string }[]>` - A promise that resolves with an array of column names for the specified table.

#### `close(): void`

Close the database connection.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/18Miguel/my-database-sqlite/blob/main/LICENSE) file for details.