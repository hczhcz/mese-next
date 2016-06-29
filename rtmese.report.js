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
            prod: Math.round(game.prod[i]),
            prod_over: round100(game.prod_over[i]),
            prod_cost_unit: Math.round(game.prod_cost_unit[i]),
            prod_cost_marginal: Math.round(game.prod_cost_marginal[i]),
            prod_cost: Math.round(game.prod_cost[i]),
        },

        goods: {
            goods: Math.round(game.goods[i]),
            goods_cost: Math.round(game.goods_cost[i]),
            goods_max_sales: Math.round(game.goods_max_sales[i]),

            goods_cost_sold: Math.round(game.goods_cost_sold[i]),
            goods_cost_inventory: Math.round(game.goods_cost_inventory[i]),
        },

        orders: {
            orders: Math.round(game.orders[i]),
            sold: Math.round(game.sold[i]),
            inventory: Math.round(game.inventory[i]),
            unfilled: Math.round(game.unfilled[i]),
        },

        balance: {
            deprecation: Math.round(game.deprecation[i]),
            capital: Math.round(game.capital[i]),
            size: Math.round(game.size[i]),
            spending: Math.round(game.spending[i]),
            balance_early: Math.round(game.balance_early[i]),
            loan_early: Math.round(game.loan_early[i]),
            interest: Math.round(game.interest[i]),

            sales: Math.round(game.sales[i]),
            inventory_charge: Math.round(game.inventory_charge[i]),
            cost_before_tax: Math.round(game.cost_before_tax[i]),
            profit_before_tax: Math.round(game.profit_before_tax[i]),
            tax_charge: Math.round(game.tax_charge[i]),
            profit: Math.round(game.profit[i]),

            balance: Math.round(game.balance[i]),
            loan: Math.round(game.loan[i]),
            cash: Math.round(game.cash[i]),
            retern: Math.round(game.retern[i]),
        },

        history: {
            history_mk: Math.round(game.history_mk[i]),
            history_rd: Math.round(game.history_rd[i]),
        },

        mpi: {
            mpi: Math.round(game.mpi[i]),
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

    return {
        decisions: {
            price: Math.round(game.decisions.price),
            average_price_given: Math.round(game.average_price_given), // special
            average_price: Math.round(game.average_price), // special
        },

        production: {
            average_prod_cost_unit: sum(game.prod_cost_unit) / game.player_count,
            average_prod_cost: sum(game.prod_cost) / game.player_count,
        },

        goods: {
            average_goods: sum(game.goods) / game.player_count,

            average_goods_cost_sold: sum(game.goods_cost_sold) / game.player_count,
        },

        orders: {
            average_orders: sum(game.orders) / game.player_count,
            sold: Math.round(game.sold),
            average_sold: sum(game.sold) / game.player_count,
            average_inventory: sum(game.inventory) / game.player_count,
            average_unfilled: sum(game.unfilled) / game.player_count,
        },

        balance: {
            average_capital: sum(game.capital) / game.player_count,
            average_size: sum(game.size) / game.player_count,

            sales: Math.round(game.sales),
            average_sales: sum(game.sales) / game.player_count,
            cost_before_tax: Math.round(game.cost_before_tax),
            average_cost_before_tax: sum(game.cost_before_tax) / game.player_count,
            profit_before_tax: Math.round(game.profit_before_tax),
            average_profit_before_tax: sum(game.profit_before_tax) / game.player_count,
            tax_charge: Math.round(game.tax_charge),
            average_tax_charge: sum(game.tax_charge) / game.player_count,
            profit: Math.round(game.profit),
            average_profit: sum(game.profit) / game.player_count,

            retern: Math.round(game.retern),
            average_retern: sum(game.retern) / game.player_count,
        },

        mpi: {
            mpi: Math.round(game.mpi),
            average_mpi: sum(game.mpi) / game.player_count,
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
