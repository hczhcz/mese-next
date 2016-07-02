'use strict';

module.exports.init = function (count, ticks, delta) {
    var game = {
        player_count: count,
        total_tick: ticks,
        now_tick: 0,
        now_period: 1,
        delta: delta,

        settings: {
            price_max: 99,
            price_min: 12,
            mk_limit: 15000 * count,
            ci_limit: 15000 * count,
            rd_limit: 15000 * count,
            loan_limit: 30000 * count,

            prod_rate_initial: 0.8,
            prod_rate_balanced: 0.8,
            prod_rate_pow: 2,
            prod_cost_factor_rate_over: 63,
            prod_cost_factor_rate_under: 63,
            prod_cost_factor_size: 15,
            prod_cost_factor_const: 3,

            unit_fee: 40,
            deprecation_rate: 0.05,

            // initial_cash: 1750 * count,
            initial_loan: 7280 * count,
            initial_capital: 21000 * count,

            interest_rate_cash: 0.025,
            interest_rate_loan: 0.05,
            inventory_fee: 1,
            tax_rate: 0.25,

            mk_overload: 2100 * count,
            mk_compression: 0.25,

            demand: 70 * count,
            demand_price: 1,
            demand_mk: 5,
            demand_rd: 1,

            demand_ref_price: 30,
            demand_ref_mk: 1050 * count,
            demand_ref_rd: 420 * count,
            demand_pow_price: 1,
            demand_pow_mk: 0.5,
            demand_pow_rd: 1,

            share_price: 0.4,
            share_mk: 0.3,
            share_rd: 0.3,
            share_pow_price: 3,
            share_pow_mk: 1.5,
            share_pow_rd: 1,

            price_overload: 40,

            mpi_retern_factor: 1617 * count,
            mpi_factor_a: 50,
            mpi_factor_b: 10,
            mpi_factor_c: 10,
            mpi_factor_d: 10,
            mpi_factor_e: 10,
            mpi_factor_f: 10,
        },

        decisions: {
            price: [],
            prod_rate: [],
            mk: [],
            ci: [],
            rd: [],
        },

        data: {
            prod: [],
            prod_over: [],
            prod_cost_unit: [],
            prod_cost_marginal: [],
            prod_cost: [],

            goods: [],
            goods_predicted: [], // notice: special
            goods_cost: [],
            goods_cost_predicted: [], // notice: special
            goods_max_sales: [],

            deprecation: [],
            capital: [],
            size: [],
            spending: [],
            balance_early: [],
            loan_early: [],
            interest: [],

            history_mk: [],
            history_rd: [],

            average_price_given: NaN,
            average_price_planned: NaN,
            average_price_mixed: NaN,
            demand_effect_mk: NaN,
            demand_effect_rd: NaN,
            orders_demand: NaN,

            share_effect_price: [],
            share_effect_mk: [],
            share_effect_rd: [],
            share: [],
            share_compressed: [],

            orders: [],
            sold: [],
            inventory: [],
            unfilled: [],

            goods_cost_sold: [],
            goods_cost_inventory: [],

            sales: [],
            inventory_charge: [],
            cost_before_tax: [],
            profit_before_tax: [],
            tax_charge: [],
            profit: [],

            balance: [],
            loan: [],
            cash: [],
            retern: [],

            average_price: NaN,

            mpi_a: [],
            mpi_b: [],
            mpi_c: [],
            mpi_d: [],
            mpi_e: [],
            mpi_f: [],
            mpi: [],
        },
    };

    for (var i = 0; i < game.player_count; ++i) {
        game.decisions.price[i] = game.settings.demand_ref_price;
        game.decisions.prod_rate[i] = game.settings.prod_rate_initial;
        game.decisions.mk[i] =
            game.settings.demand_ref_mk / game.player_count;
        game.decisions.ci[i] =
            game.settings.initial_capital / game.player_count
            * game.settings.deprecation_rate;
        game.decisions.rd[i] =
            game.settings.demand_ref_rd / game.player_count;

        game.data.capital[i] = game.settings.initial_capital / game.player_count;
        game.data.size[i] = game.data.capital[i] / game.settings.unit_fee;
        game.data.history_mk[i] = game.decisions.mk[i];
        game.data.history_rd[i] = game.decisions.rd[i];

        game.data.inventory[i] = 0;
        game.data.goods_cost_inventory[i] = 0;

        game.data.loan[i] = game.settings.initial_loan / game.player_count;
        game.data.cash[i] = 0;
        game.data.retern[i] = game.settings.mpi_retern_factor;
    }

    game.data.average_price = game.settings.demand_ref_price;

    return game;
};

// return true if not finished
module.exports.exec = function (game) {
    var minmax = function (a, min, max) {
        return Math.min(Math.max(a, min), max);
    };

    var div = function (a, b, e) {
        return b === 0 ? e : a / b;
    };

    // notice: also in report.printDataPublic
    var sum = function (data) {
        var s = 0;

        for (var i = 0; i < game.player_count; ++i) {
            s += data[i];
        }

        return s;
    };

    var each = function (callback) {
        for (var i = 0; i < game.player_count; ++i) {
            callback(i);
        }
    };

    if (game.now_tick >= game.total_tick) { // TODO: duplicated
        return false;
    }

    game.now_tick += 1;
    game.now_period += game.delta;

    each(function (i) {
        // check decisions

        game.decisions.price[i] = minmax(
            game.decisions.price[i],
            game.settings.price_min, game.settings.price_max
        );

        game.decisions.prod_rate[i] = minmax(
            game.decisions.prod_rate[i],
            0, 1
        );
        game.decisions.mk[i] = minmax(
            game.decisions.mk[i],
            0, game.settings.mk_limit / game.player_count
        );
        game.decisions.ci[i] = minmax(
            game.decisions.ci[i],
            0, game.settings.ci_limit / game.player_count
        );
        game.decisions.rd[i] = minmax(
            game.decisions.rd[i],
            0, game.settings.rd_limit / game.player_count
        );

        // check the loan limit

        if (game.data.loan[i] > game.settings.loan_limit / game.player_count) {
            game.decisions.prod_rate[i] = 0;
            game.decisions.mk[i] = 0;
            game.decisions.ci[i] = 0;
            game.decisions.rd[i] = 0;
        }

        // go

        game.data.prod[i] = game.decisions.prod_rate[i] * game.data.size[i];
        game.data.prod_over[i] = game.decisions.prod_rate[i] - game.settings.prod_rate_balanced;

        var prod_cost_factor_rate = game.data.prod_over[i] > 0 ?
            game.settings.prod_cost_factor_rate_over :
            game.settings.prod_cost_factor_rate_under;

        game.data.prod_cost_unit[i] = prod_cost_factor_rate * Math.pow(game.data.prod_over[i], game.settings.prod_rate_pow)
            + game.settings.prod_cost_factor_size * game.settings.initial_capital / game.data.capital[i] / game.player_count
            + game.settings.prod_cost_factor_const;
        game.data.prod_cost_marginal[i] = prod_cost_factor_rate
                * game.settings.prod_rate_pow
                * game.decisions.prod_rate[i]
                * Math.pow(game.data.prod_over[i], game.settings.prod_rate_pow - 1)
            + game.data.prod_cost_unit[i];
        game.data.prod_cost[i] = game.data.prod_cost_unit[i] * game.data.prod[i];

        game.data.goods[i] = game.data.inventory[i] + game.data.prod[i] * game.delta;
        game.data.goods_predicted[i] = game.data.inventory[i] + game.data.prod[i];
        game.data.goods_cost[i] = game.data.goods_cost_inventory[i] + game.data.prod_cost[i] * game.delta;
        game.data.goods_cost_predicted[i] = game.data.goods_cost_inventory[i] + game.data.prod_cost[i];
        game.data.goods_max_sales[i] = game.decisions.price[i] * game.data.goods_predicted[i];

        game.data.deprecation[i] = game.data.capital[i] * game.settings.deprecation_rate;
        game.data.capital[i] += (game.decisions.ci[i] - game.data.deprecation[i]) * game.delta;
        game.data.size[i] = game.data.capital[i] / game.settings.unit_fee;

        game.data.spending[i] = game.data.prod_cost[i]
            + game.decisions.ci[i] - game.data.deprecation[i]
            + game.decisions.mk[i] + game.decisions.rd[i];
        game.data.balance_early[i] = game.data.cash[i] - game.data.loan[i] - game.data.spending[i] * game.delta;
        game.data.loan_early[i] = Math.max(- game.data.balance_early[i], 0);
        game.data.interest[i] = (
            game.data.balance_early[i] >= 0 ?
            game.settings.interest_rate_cash : game.settings.interest_rate_loan
        ) * game.data.balance_early[i];

        game.data.history_mk[i] += game.decisions.mk[i] * game.delta;
        game.data.history_rd[i] += game.decisions.rd[i] * game.delta;
    });

    var sum_mk = sum(game.decisions.mk);
    var sum_mk_compressed = Math.min(
        (sum_mk - game.settings.mk_overload) * game.settings.mk_compression
        + game.settings.mk_overload,
        sum_mk
    );
    var sum_history_mk = sum(game.data.history_mk);
    var sum_history_rd = sum(game.data.history_rd);

    game.data.average_price_given = sum(game.decisions.price) / game.player_count;
    game.data.average_price_planned = div(sum(game.data.goods_max_sales), sum(game.data.goods_predicted), game.data.average_price_given);
    game.data.average_price_mixed = game.settings.demand_price * game.data.average_price_planned
        + (1 - game.settings.demand_price) * game.data.average_price;

    game.data.demand_effect_mk = game.settings.demand_mk * Math.pow(
        sum_mk_compressed / game.settings.demand_ref_mk,
        game.settings.demand_pow_mk
    ) / Math.pow(
        game.data.average_price_mixed / game.settings.demand_ref_price,
        game.settings.demand_pow_price
    );
    game.data.demand_effect_rd = game.settings.demand_rd * Math.pow(
        sum_history_rd / game.now_period / game.settings.demand_ref_rd,
        game.settings.demand_pow_rd
    );
    game.data.orders_demand = game.settings.demand * (
        game.data.demand_effect_rd + game.data.demand_effect_mk
    );

    each(function (i) {
        game.data.share_effect_price[i] = Math.pow(
            game.data.average_price_mixed / game.decisions.price[i],
            game.settings.share_pow_price
        );
        game.data.share_effect_mk[i] = Math.pow(
            game.decisions.mk[i] / game.decisions.price[i],
            game.settings.share_pow_mk
        );
        game.data.share_effect_rd[i] = Math.pow(
            game.data.history_rd[i],
            game.settings.share_pow_rd
        );
    });

    var sum_share_effect_price = sum(game.data.share_effect_price);
    var sum_share_effect_mk = sum(game.data.share_effect_mk);
    var sum_share_effect_rd = sum(game.data.share_effect_rd);

    each(function (i) {
        // orders

        game.data.share[i] = game.settings.share_price * div(game.data.share_effect_price[i], sum_share_effect_price, 0)
            + game.settings.share_mk * div(game.data.share_effect_mk[i], sum_share_effect_mk, 0)
            + game.settings.share_rd * div(game.data.share_effect_rd[i], sum_share_effect_rd, 0);

        game.data.share_compressed[i] = Math.min(game.data.share[i] * game.settings.price_overload / game.decisions.price[i], game.data.share[i]);

        game.data.orders[i] = game.data.orders_demand * game.data.share_compressed[i];
        game.data.sold[i] = Math.min(game.data.orders[i], game.data.goods[i] / game.delta);
        game.data.inventory[i] = game.data.goods[i] - game.data.sold[i] * game.delta;
        game.data.unfilled[i] = game.data.orders[i] - game.data.sold[i];

        // goods

        game.data.goods_cost_sold[i] = game.data.goods_cost[i] * div(game.data.sold[i], game.data.goods[i], 0);
        game.data.goods_cost_inventory[i] = game.data.goods_cost[i] - game.data.goods_cost_sold[i] * game.delta;

        // cash flow

        game.data.sales[i] = game.decisions.price[i] * game.data.sold[i];

        game.data.inventory_charge[i] = Math.min(
            game.data.inventory[i], game.data.inventory[i]
        ) * game.settings.inventory_fee;

        game.data.cost_before_tax[i] = game.data.goods_cost_sold[i]
            + game.data.deprecation[i]
            + game.decisions.mk[i] + game.decisions.rd[i]
            - game.data.interest[i] + game.data.inventory_charge[i];
        game.data.profit_before_tax[i] = game.data.sales[i] - game.data.cost_before_tax[i];
        game.data.tax_charge[i] = game.data.profit_before_tax[i] * game.settings.tax_rate;
        game.data.profit[i] = game.data.profit_before_tax[i] - game.data.tax_charge[i];

        game.data.balance[i] = game.data.cash[i]
            + game.data.loan_early[i] - game.data.loan[i]
            + (
                game.data.profit[i]
                - game.decisions.ci[i] + game.data.deprecation[i]
                + game.data.goods_cost_sold[i] - game.data.prod_cost[i]
            ) * game.delta;
        game.data.loan[i] = Math.max(game.data.loan_early[i], game.data.loan_early[i] - game.data.balance[i]);
        game.data.cash[i] = Math.max(game.data.balance[i], 0);
        game.data.retern[i] += game.data.profit[i] * game.delta;
    });

    game.data.average_price = div(sum(game.data.sales), sum(game.data.sold), game.data.average_price_given);

    var sum_size = sum(game.data.size);
    var sum_sold = sum(game.data.sold);

    each(function (i) {
        game.data.mpi_a[i] = game.settings.mpi_factor_a * game.player_count
            * (game.data.retern[i] / game.now_period / game.settings.mpi_retern_factor);

        game.data.mpi_b[i] = game.settings.mpi_factor_b * game.player_count
            * ((game.data.history_rd[i] + game.data.history_mk[i]) / (sum_history_rd + sum_history_mk));

        game.data.mpi_c[i] = game.settings.mpi_factor_c * game.player_count
            * (game.data.size[i] / sum_size);

        game.data.mpi_d[i] = game.settings.mpi_factor_d
            * (1 - Math.abs(game.data.prod_over[i]));

        game.data.mpi_e[i] = game.settings.mpi_factor_e * game.player_count
            * div(game.data.sold[i], sum_sold, 0);

        game.data.mpi_f[i] = game.settings.mpi_factor_f;

        game.data.mpi[i] = game.data.mpi_a[i] + game.data.mpi_b[i] + game.data.mpi_c[i]
            + game.data.mpi_d[i] + game.data.mpi_e[i] + game.data.mpi_f[i];
    });

    return game.now_tick < game.total_tick;
};
