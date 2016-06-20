'use strict';

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
            price: game.decisions.price[i],
            prod_rate: game.decisions.prod_rate[i],
            mk: game.decisions.mk[i],
            ci: game.decisions.ci[i],
            rd: game.decisions.rd[i],
        },

        production: {
            prod: game.prod[i],
            prod_over: game.prod_over[i],
            prod_cost_unit: game.prod_cost_unit[i],
            prod_cost_marginal: game.prod_cost_marginal[i],
            prod_cost: game.prod_cost[i],
        },

        goods: {
            goods: game.goods[i],
            goods_cost: game.goods_cost[i],
            goods_max_sales: game.goods_max_sales[i],

            goods_cost_sold: game.goods_cost_sold[i],
            goods_cost_inventory: game.goods_cost_inventory[i],
        },

        orders: {
            orders: game.orders[i],
            sold: game.sold[i],
            inventory: game.inventory[i],
            unfilled: game.unfilled[i],
        },

        balance: {
            deprecation: game.deprecation[i],
            capital: game.capital[i],
            size: game.size[i],
            spending: game.spending[i],
            balance_early: game.balance_early[i],
            loan_early: game.loan_early[i],
            interest: game.interest[i],

            sales: game.sales[i],
            inventory_charge: game.inventory_charge[i],
            cost_before_tax: game.cost_before_tax[i],
            profit_before_tax: game.profit_before_tax[i],
            tax_charge: game.tax_charge[i],
            profit: game.profit[i],

            balance: game.balance[i],
            loan: game.loan[i],
            cash: game.cash[i],
            retern: game.retern[i],
        },

        history: {
            history_mk: game.history_mk[i],
            history_rd: game.history_rd[i],
        },

        mpi: {
            mpi: game.mpi[i],
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
            price: game.decisions.price,
            average_price_given: game.average_price_given, // special
            average_price: game.average_price, // special
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
            sold: game.sold,
            average_sold: sum(game.sold) / game.player_count,
            average_inventory: sum(game.inventory) / game.player_count,
            average_unfilled: sum(game.unfilled) / game.player_count,
        },

        balance: {
            average_capital: sum(game.capital) / game.player_count,
            average_size: sum(game.size) / game.player_count,

            sales: game.sales,
            average_sales: sum(game.sales) / game.player_count,
            cost_before_tax: game.cost_before_tax,
            average_cost_before_tax: sum(game.cost_before_tax) / game.player_count,
            profit_before_tax: game.profit_before_tax,
            average_profit_before_tax: sum(game.profit_before_tax) / game.player_count,
            tax_charge: game.tax_charge,
            average_tax_charge: sum(game.tax_charge) / game.player_count,
            profit: game.profit,
            average_profit: sum(game.profit) / game.player_count,

            retern: game.retern,
            average_retern: sum(game.retern) / game.player_count,
        },

        mpi: {
            mpi: game.mpi,
            average_mpi: sum(game.mpi) / game.player_count,
        },
    };
};

module.exports.printPlayer = function (game, player) {
    return {
        player_count: game.player_count,
        now_period: game.now_period,
        progress: game.now_tick / game.final_tick,

        settings: printSettings(game),
        data: printData(game, player),
        data_public: printDataPublic(game),
    };
};

module.exports.printPublic = function (game) {
    return {
        player_count: game.player_count,
        now_period: game.now_period,
        progress: game.now_tick / game.final_tick,

        settings: printSettings(game),
        data_public: printDataPublic(game),
    };
};
