const MyDatabase = require('../index');

async function runTests() {
    const UserTable = 'users', DepartmentTable = 'departments';
    const db = new MyDatabase(':memory:');

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
        console.log('Users:', await db.selectRows(UserTable));
        console.log('Departments:', await db.selectRows(DepartmentTable));

        await db.updateRow(UserTable, { age: 31 }, 'WHERE name = "John Doe"');
        console.log('Updated Users:', await db.selectRows(UserTable));

        await db.insertRows(`${DepartmentTable}_${UserTable}`, { department_id: 1, user_id: 1 });
        await db.insertRows(`${DepartmentTable}_${UserTable}`, { department_id: 1, user_id: 2 });
        console.log(`\nTable "${DepartmentTable}_${UserTable}":`, await db.selectRows(`${DepartmentTable}_${UserTable}`));

        await db.deleteRows(UserTable, 'WHERE name = "Jane Smith"');
        console.log('Remaining Users:', await db.selectRows(UserTable));
        console.log(`Remaining rows in "${DepartmentTable}_${UserTable}" table:`, await db.selectRows(`${DepartmentTable}_${UserTable}`));

        await db.dropTable(UserTable);
        const newAllTables = await db.getAllTables();
        console.log(`All Tables After Dropping "${UserTable}":`, newAllTables.map(table => JSON.stringify(table)));

    } catch (error) {
        console.error('Error:', error);

    } finally {
        db.close();
    }
}

runTests();
