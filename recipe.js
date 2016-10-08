$(document).ready(function () {
    Backbone.Layout.configure({
        manage: true
    });

    window.Recipe = {
        Models: {},
        Collections: {},
        Views: {},
        Templates: {}
    };

    // Start templates
    Recipe.Templates.search = _.template($('#search-template').html());
    Recipe.Templates.results = _.template($('#results-template').html());
    Recipe.Templates.recipe = _.template($('#recipe-template').html());

    // Start models
    Recipe.Models.Recipe = Backbone.Model.extend();
    Recipe.Models.Ingredient = Backbone.Model.extend();

    var purpleMonster = { id: 1, name: "Beef" };
    var tomato = { id: 2, name: "Tomato" };
    var pasta  = { id: 3, name: "Pasta" };
    var bread = {  id: 4, name: "Bread" };
    var cheese = { id: 5, name: "Cheese" };
    var butter = { id: 6, name: 'Butter' };

    // Start collections
    Recipe.Collections.Recipes = Backbone.Collection.extend({
        model: Recipe.Models.Recipe,
        initialize: function (models, options) {
            _.each(models, function (model) {
                model.ingredients = new Recipe.Collections.Ingredients(ingredientsCollection.filter(function (ingredient) {
                    var result = false;
                    _.each(model.ingredients, function (recipeIngredient) {
                        if (recipeIngredient.id == ingredient.get('id')) {
                            result = true;
                        }
                    });
                    return result;
                }));
            });
        }
    });
    Recipe.Collections.Ingredients = Backbone.Collection.extend({
        model: Recipe.Models.Ingredient
    });

    var meatSauce = {
        id: 1,
        name: 'Meat Sauce',
        ingredients: [ purpleMonster, tomato, pasta ]
    };

    var burgers = {
        id: 2,
        name: 'Burgers',
        ingredients: [ purpleMonster, bread, cheese ]
    };

    var toast = {
        id: 3,
        name: 'Toast',
        ingredients: [ bread, butter ]
    };

    window.ingredientsCollection = new Recipe.Collections.Ingredients([
        purpleMonster,
        tomato,
        pasta,
        bread,
        cheese,
        butter
    ]);

    window.recipeCollection = new Recipe.Collections.Recipes([ meatSauce, burgers, toast ]);

    // Start views
    Recipe.Views.SearchView = Backbone.View.extend({
        template: Recipe.Templates.search,
        events: {
            'click button': 'search'
        },
        afterRender: function () {
            this.$select = this.$el.find('select');
            this.$select.select2({
                tags: true,
                tokenSeparators: [',', ' '],
                data: this.collection.map(function (model) {
                    return { id: model.get('id'), text: model.get('name') }
                })
            });
        },
        search: function () {
            var ingredients = _.map(this.$select.val(), function (ingredient) {
                return this.collection.get(ingredient);
            }, this);
            Backbone.trigger('Recipe:search', ingredients);
        }
    });

    Recipe.Views.RecipeView = Backbone.View.extend({
        template: Recipe.Templates.recipe,
        tagName: 'li'
    });

    Recipe.Views.ResultsView = Backbone.View.extend({
        template: Recipe.Templates.results,
        initialize: function () {
            this.allRecipes = this.collection;
            this.listenTo(Backbone, 'Recipe:search', this.search)
        },
        beforeRender: function () {
            this.collection.each(function (model) {
                this.addView(model, false)
            }, this)
        },
        addView: function (model, render) {
            var view = this.insertView('ul', new Recipe.Views.RecipeView({ model: model }));
            if (render !== false) {
                view.render();
            }
        },
        search: function (ingredients) {
            this.removeView('ul');
            if (ingredients.length == 0) {
                this.collection = this.allRecipes;
                this.beforeRender();
                this.renderViews('ul');
            }
            else {
                var results = [];
                recipeCollection.each(function (recipe) {
                    if (_.every(ingredients, function (ingredient) {
                        return recipe.get('ingredients').contains(ingredient);
                    })) {
                        results.push(recipe);
                    }
                });
                this.collection = new Recipe.Collections.Recipes(results);
                this.beforeRender();
                this.renderViews('ul');
            }
        }
    });

    Recipe.Views.Main = Backbone.View.extend({
        template: "#main-template",
        initialize: function () {
            this.setViews({
                '#search-container': new Recipe.Views.SearchView({ collection: ingredientsCollection }),
                '#results-container': new Recipe.Views.ResultsView({ collection: recipeCollection })
            });
        }
    });

    // Init stuff
    var app = new Recipe.Views.Main();
    app.render();
    var main = $('#main');
    main.append(app.$el);
});
