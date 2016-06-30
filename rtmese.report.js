'use strict';

var round100 = function (value) {
    return 0.01 * Math.round(100 * value);
};

var printSettings = function (game) {
    return {
        limits: {
            price_max: game.settings.price_max,
            price_min: game.settings.price_min,
            mk_limit: game.settings.mk_limit / game.player_count, // per player
            ci_limit: game.settings.ci_limit / game.player_count, // per player
            rd_limit: game.settings.rd_limit / game.player_count, // per player
            loan_limit: game.settings.loan_limit / game.player_count, // per player
        },

        production: {
            prod_rate_balanced: game.settings.prod_rate_balanced,

            unit_fee: game.settings.unit_fee,
            deprecation_rate: game.settings.deprecation_rate,
        },

        balance: {
            interest_rate_cash: game.settings.interest_rate_cash,
            interest_rate_loan: game.settings.interest_rate_loan,
            inventory_fee: game.settings.inventory_fee,
            tax_rate: game.settings.tax_rate,
        },
    };
};

var printData = function (game, i) {
    return {
        decisions: {
            price: Math.round(game.decisions.price[i]),
            prod_rate: round100(game.decisions.prod_rate[i]),
            mk: Math.round(game.decisions.mk[i]),
            ci: Math.round(game.decisions.ci[i]),
            rd: Math.round(game.decisions.rd[i]),
        },

        production: {
            prod: Math.round(game.data.prod[i]),
            prod_over: round100(game.data.prod_over[i]),
            prod_cost_unit: Math.round(game.data.prod_cost_unit[i]),
            prod_cost_marginal: Math.round(game.data.prod_cost_marginal[i]),
            prod_cost: Math.round(game.data.prod_cost[i]),
        },

        goods: {
            goods: Math.round(game.data.goods[i]),
            goods_cost: Math.round(game.data.goods_cost[i]),
            goods_max_sales: Math.round(game.data.goods_max_sales[i]),

            goods_cost_sold: Math.round(game.data.goods_cost_sold[i]),
            goods_cost_inventory: Math.round(game.data.goods_cost_inventory[i]),
        },

        orders: {
            orders: Math.round(game.data.orders[i]),
            sold: Math.round(game.data.sold[i]),
            inventory: Math.round(game.data.inventory[i]),
            unfilled: Math.round(game.data.unfilled[i]),
        },

        balance: {
            deprecation: Math.round(game.data.deprecation[i]),
            capital: Math.round(game.data.capital[i]),
            size: Math.round(game.data.size[i]),
            spending: Math.round(game.data.spending[i]),
            balance_early: Math.round(game.data.balance_early[i]),
            loan_early: Math.round(game.data.loan_early[i]),
            interest: Math.round(game.data.interest[i]),

            sales: Math.round(game.data.sales[i]),
            inventory_charge: Math.round(game.data.inventory_charge[i]),
            cost_before_tax: Math.round(game.data.cost_before_tax[i]),
            profit_before_tax: Math.round(game.data.profit_before_tax[i]),
            tax_charge: Math.round(game.data.tax_charge[i]),
            profit: Math.round(game.data.profit[i]),

            balance: Math.round(game.data.balance[i]),
            loan: Math.round(game.data.loan[i]),
            cash: Math.round(game.data.cash[i]),
            retern: Math.round(game.data.retern[i]),
        },

        history: {
            history_mk: Math.round(game.data.history_mk[i]),
            history_rd: Math.round(game.data.history_rd[i]),
        },

        mpi: {
            mpi: Math.round(game.data.mpi[i]),
        },
    };
};

var printDataPublic = function (game) {
    // notice: also in engine.exec
    var sum = function (data) {
        var s = 0;

        for (var i = 0; i < game.player_count; ++i) {
            s += data[i];
        }

        return s;
    };

    var roundAll = function (data) {
        var l = [];

        for (var i = 0; i < game.player_count; ++i) {
            l[i] = Math.round(data[i]);
        }

        return l;
    }

    return {
        decisions: {
            price: roundAll(game.decisions.price),
            average_price_given: Math.round(game.data.average_price_given), // special
            average_price: Math.round(game.data.average_price), // special
        },

        production: {
            average_prod_cost_unit: Math.round(sum(game.data.prod_cost_unit) / game.player_count),
            average_prod_cost: Math.round(sum(game.data.prod_cost) / game.player_count),
        },

        goods: {
            average_goods: Math.round(sum(game.data.goods) / game.player_count),

            average_goods_cost_sold: Math.round(sum(game.data.goods_cost_sold) / game.player_count),
        },

        orders: {
            average_orders: Math.round(sum(game.data.orders) / game.player_count),
            sold: roundAll(game.data.sold),
            average_sold: Math.round(sum(game.data.sold) / game.player_count),
            average_inventory: Math.round(sum(game.data.inventory) / game.player_count),
            average_unfilled: Math.round(sum(game.data.unfilled) / game.player_count),
        },

        balance: {
            average_capital: Math.round(sum(game.data.capital) / game.player_count),
            average_size: Math.round(sum(game.data.size) / game.player_count),

            sales: roundAll(game.data.sales),
            average_sales: Math.round(sum(game.data.sales) / game.player_count),
            cost_before_tax: roundAll(game.data.cost_before_tax),
            average_cost_before_tax: Math.round(sum(game.data.cost_before_tax) / game.player_count),
            profit_before_tax: roundAll(game.data.profit_before_tax),
            average_profit_before_tax: Math.round(sum(game.data.profit_before_tax) / game.player_count),
            tax_charge: roundAll(game.data.tax_charge),
            average_tax_charge: Math.round(sum(game.data.tax_charge) / game.player_count),
            profit: roundAll(game.data.profit),
            average_profit: Math.round(sum(game.data.profit) / game.player_count),

            retern: roundAll(game.data.retern),
            average_retern: Math.round(sum(game.data.retern) / game.player_count),
        },

        mpi: {
            mpi: roundAll(game.data.mpi),
            average_mpi: Math.round(sum(game.data.mpi) / game.player_count),
        },
    };
};

module.exports.printPlayer = function (game, player) {
    return {
        player_count: game.player_count,
        now_period: round100(game.now_period),
        progress: round100(game.now_tick / game.total_tick),

        settings: printSettings(game),
        data: printData(game, player),
        data_public: printDataPublic(game),
    };
};

module.exports.printPublic = function (game) {
    return {
        player_count: game.player_count,
        now_period: round100(game.now_period),
        progress: round100(game.now_tick / game.total_tick),

        settings: printSettings(game),
        data_public: printDataPublic(game),
    };
};
