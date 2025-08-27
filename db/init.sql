CREATE TABLE suppliers (id SERIAL PRIMARY KEY, name VARCHAR(100), contact_info VARCHAR(255));
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100), contact_info VARCHAR(255));
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), price NUMERIC(10,2), batch_number VARCHAR(50), expiry_date DATE);
CREATE TABLE purchases (id SERIAL PRIMARY KEY, supplier_id INT REFERENCES suppliers(id), purchase_date TIMESTAMP DEFAULT NOW(), total NUMERIC(10,2));
CREATE TABLE purchase_items (id SERIAL PRIMARY KEY, purchase_id INT REFERENCES purchases(id) ON DELETE CASCADE, product_id INT REFERENCES products(id), quantity INT, price NUMERIC(10,2));
CREATE TABLE sales (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), sale_date TIMESTAMP DEFAULT NOW(), total NUMERIC(10,2));
CREATE TABLE sale_items (id SERIAL PRIMARY KEY, sale_id INT REFERENCES sales(id) ON DELETE CASCADE, product_id INT REFERENCES products(id), quantity INT, price NUMERIC(10,2));
CREATE TABLE payments (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), invoice_id INT REFERENCES sales(id), amount NUMERIC(10,2), payment_date TIMESTAMP DEFAULT NOW(), payment_mode VARCHAR(50));