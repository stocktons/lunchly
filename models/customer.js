"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) { 
    // notice that the above line is a destructured object!
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes; // this will call the get notes method
  }
  get full_name() {
    return `${this.firstName} ${this.lastName}`; 
  }
  // now customer.full_name will totally work

  get notes() {
    return this._notes // the underscore is not important, 
    // and neither is notes. This line could be "return this.tacos" BUT the
    // underscore prevents the notes method from recursively calling itself!
  }

  set notes(val) {
    if (val != "oweifw") throw Error("bad!")
    this._notes = val;
  }
  // people can still set notes with customer.notes!

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    // returns an array of new customer instances
    return results.rows.map(c => new Customer(c));
  }

  /** find customers via the search bar. */

  static async search(term) {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name AS "lastName", 
              phone, 
              notes
       FROM customers
       WHERE first_name ILIKE $1
       OR last_name ILIKE $1
       ORDER BY last_name`,
       [`%${term}%`], 
    );

    let searchResults = results.rows;

    //if (searchResults.length === 0) {
      // const err = new Error(`No customer matching: ${term}`);
      // err.status = 404;
      // throw err;

      // searchResults = [{firstName: `${term}`, lastName: 'not found'}]
    //}

    return searchResults.map(c => new Customer(c))
  }

  /** find top 10 customers by number of reservations. */

  static async topTen() {
    const results = await db.query(
          `SELECT customers.id, COUNT(reservations.id) AS num_reservations,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  customers.notes
           FROM customers
           JOIN reservations
           ON reservations.customer_id = customers.id
           GROUP BY customers.id
           ORDER BY num_reservations desc, last_name
           LIMIT 10`,
    );

    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }
  /** Display customer first and last names as one string.  */
  fullName() {
    return `${this.firstName} ${this.lastName}`
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
}

module.exports = Customer;
