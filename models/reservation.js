"use strict";

/** Reservation for Lunchly */

const moment = require("moment"); //A JavaScript date library 
// for parsing, validating, manipulating, and formatting dates.

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    // a destructured object as the parameter
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
    // the JS date library Moment.js - used in customer_detail.html
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }


  /** save or update this reservation. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customerId, numGuests, startAt, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
          `UPDATE reservations
           SET customerId=$1,
               numGuests=$2,
               startAt=$3,
               notes=$4
            WHERE id = $5`, [
          this.customerId,
          this.numGuests,
          this.startAt,
          this.notes,
          this.id,
        ],
      );
    }
  } 
}

module.exports = Reservation;
