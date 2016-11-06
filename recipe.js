/*  MyToDo:
    ======
1.  Fix non-working sequence of: Search-recipe/s, THEN add-new-recipe -> recipe is added to collection but is NOT rendered.
2.  DONE! Fix non-working sequence of: Delete-recipe, THEN add-new-recipe -> new recipe is NOT added to collection.
3.  Disallow updating of empty values.
4.  Clear values of input fields after update/cancel clicks (already done for updating recipe title in single recipe view.)
5.  Add functionality to single recipe ingredients section buttons.
6.  Display search criteria in H2 heading "Recipes."
7.  Implement search score with slider.
8.  Fix: Update view of edited recipe title.
*/


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

    //================
    // Start templates
    //================

    Recipe.Templates.mainLayout = _.template($("#main-layout-template").html());
    Recipe.Templates.search = _.template($('#search-template').html());
    Recipe.Templates.newRecipe = _.template($("#new-recipe-template").html());
    Recipe.Templates.results = _.template($('#results-template').html());
    Recipe.Templates.recipes = _.template($('#recipes-template').html());
    Recipe.Templates.singleRecipe = _.template($('#recipe-full-template').html());
    Recipe.Templates.ingredients = _.template($('#ingredients-template').html());

    // ============
    // Start models
    // ============

    // Recipe Model
    //=============
    Recipe.Models.Recipe = Backbone.Model.extend({
        defaults: {
            id: '',
            name: '',
            ingredients: []
        }
    });

    // Ingredient Model
    //=================
    Recipe.Models.Ingredient = Backbone.Model.extend({
        defaults: {
            id: '',
            name: ''
        }
    });

    // ====================
    // Ingredient instances
    // ====================

    var beef = {
        id: 1,
        name: "Beef"
    };
    var tomato = {
        id: 2,
        name: "Tomato"
    };
    var pasta  = {
        id: 3,
        name: "Pasta"
    };
    var bread = {
        id: 4,
        name: "Bread"
    };
    var cheese = {
        id: 5,
        name: "Cheese"
    };
    var butter = {
        id: 6,
        name: 'Butter'
    };
    var flour = {
        id: 7,
        name: 'Flour'
    };
    var lettuce = {
        id: 8,
        name: 'Lettuce'
    };
    var milk = {
        id: 9,
        name: 'Milk'
    };
    var sugar = {
        id: 10,
        name: 'Sugar'
    };

    // ================
    // Recipe instances
    // ================

    var spaghettiBolognese = {
        id: 1,
        name: 'Spaghetti Bolognese',
        ingredients: [ beef, tomato, pasta ]
    };
    var burgers = {
        id: 2,
        name: 'Burgers',
        ingredients: [ beef, bread, cheese ]
    };
    var toast = {
        id: 3,
        name: 'Toast',
        ingredients: [ bread, butter ]
    };
    var salad = {
        id: 4,
        name: 'Salad',
        ingredients: [ bread, tomato, lettuce]
    };
    var cake = {
        id: 5,
        name: 'Cake',
        ingredients: [ milk, flour, sugar, butter ]
    };


    // =================
    // Start collections
    // =================

    // Recipe Collection
    // =================

    Recipe.Collections.Recipes = Backbone.Collection.extend({
        model: Recipe.Models.Recipe,
// ??? What is the "options" parameter for?
        initialize: function (models, options) {
// ??? This is part 2 of what worked to delete recipe from search results (part 1 is in the recipes view.)
            this.on('delete', this.remove);
            this.on('add', this.add);
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

    // Ingredients Collection
    // ======================

    Recipe.Collections.Ingredients = Backbone.Collection.extend({
        model: Recipe.Models.Ingredient
    });

    //========================
    // Instantiate Collections
    //========================

    window.ingredientsCollection = new Recipe.Collections.Ingredients([
        beef,
        tomato,
        pasta,
        bread,
        cheese,
        butter,
        flour,
        lettuce,
        milk,
        sugar
    ]);
    window.recipesCollection = new Recipe.Collections.Recipes([
        spaghettiBolognese,
        burgers,
        toast,
        salad,
        cake
    ]);

    // ===========
    // Start views
    // ===========

    // MainLayout View: Displays search and results containers
    // =======================================================

    Recipe.Views.MainLayout = Backbone.View.extend({
        template: Recipe.Templates.mainLayout,
        initialize: function () {
            this.setViews({
                '#search-container': new Recipe.Views.Search({ collection: ingredientsCollection }),
                '#new-recipe-container': new Recipe.Views.NewRecipe ({ recipes: recipesCollection }, {ingredients: ingredientsCollection}),
                '#results-container': new Recipe.Views.Results({ collection: recipesCollection })
            });
        }
    });

    // Search view
    // ===========

    Recipe.Views.Search = Backbone.View.extend({
        template: Recipe.Templates.search,
        events: {
            'click .btn-search': 'search'
        },
        afterRender: function () {
            this.$select = this.$el.find('select');
            this.$select.select2({
                tags: true,
                tokenSeparators: [',', ' '],
                placeholder: 'Select ingredients',
                allowClear: true,
                closeOnSelect: false,
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

    // New recipe view
    // ===============

    Recipe.Views.NewRecipe = Backbone.View.extend({
        template: Recipe.Templates.newRecipe,
        events: {
            'click .btn-new-recipe': 'newRecipe'
        },
        afterRender: function () {
            this.$select = this.$el.find('select');
            this.$select.select2({
                tags: true,
                tokenSeparators: [',', ' '],
                placeholder: 'Select ingredients',
                allowClear: true,
                closeOnSelect: false,
                data: ingredientsCollection.map(function (model) {
                    return { id: model.get('id'), text: model.get('name') }
                })
            });
        },
         newRecipe: function() {
            name = this.$('.input-add-new-recipe-name').val();
            var ingredientInput = this.$('.select-ingredients').val();
            var newIngredients = _.map(ingredientInput, function(value) {
                return {id:value, name:ingredientsCollection.get(value).get('name')}
            });
            var addedIngredients = new Recipe.Collections.Ingredients(newIngredients);
            count = recipesCollection.length;
            lastModelId = recipesCollection.at(count-1).get('id');
            newModelId = lastModelId + 1;
            recipesCollection.add({
                id: newModelId,
                name: name,
                ingredients: addedIngredients
            });
            Backbone.trigger('Recipe:add', newModelId);
        }
    });

    // Recipes view: Display all recipes or search result recipes
    // ==========================================================

    Recipe.Views.Recipes = Backbone.View.extend({
        template: Recipe.Templates.recipes,
        tagName: 'li',

        events: {
            'click .recipe': 'recipe',
            'click .btn-edit-recipe': 'editRecipe',
            'click .btn-delete-recipe': 'deleteRecipe'
        },
        recipe: function () {
            router.navigate("recipe/" + this.model.get('id'), { trigger: true });
        },
        editRecipe: function () {

            router.navigate("recipe/" + this.model.get('id'), { trigger: true });
        },
        deleteRecipe: function () {
// ??? This is part 1 of what worked to delete recipe from search results (part 2 is in the recipe collection's "initialize.")
            this.model.trigger('delete', this.model);
        }
    });

    // Single recipe view
    //===================

    Recipe.Views.SingleRecipe = Backbone.View.extend({
        template: Recipe.Templates.singleRecipe,
        initialize: function() {
// ??? Why don't these work either? I had to put them as "display: none" in css.
            this.$el.find('.input-edit-recipe-title').hide();
            this.$el.find('.recipe-title').show();
            this.$el.find('.btn-update').hide();
            this.$el.find('.btn-cancel').hide();
            this.$el.find('.select-ingredients').hide();
        },
        events: {
            'click .btn-edit-recipe-title': 'editRecipeTitle',
            'click .btn-update-recipe-title': 'updateRecipeTitle',
            'click .btn-cancel-recipe-title': 'cancelRecipeTitle',
            'click .btn-add-ingredient': 'addIngredient',
            'click .btn-update-add-ingredient': 'updateAddIngredient',
            'click .btn-cancel-add-ingredient': 'cancelAddIngredient',
            'click .btn-delete-ingredient': 'deleteIngredient'
        },
        afterRender: function () {
            this.$select = this.$el.find('select');
            this.$select.select2({
                tags: true,
                tokenSeparators: [',', ' '],
                placeholder: 'Select ingredients',
                allowClear: true,
                closeOnSelect: false,
                data: ingredientsCollection.map(function (model) {
                    return { id: model.get('id'), text: model.get('name') }
                })
            });
        },
        //Edit title - mostly show hide input field and buttons
        editRecipeTitle: function() {
            this.$('.input-edit-recipe-title').show();
            this.$('h2.recipe-title').hide();
            this.$('.btn-edit-recipe-title').hide();
            this.$('.btn-update-recipe-title').show();
            this.$('.btn-cancel-recipe-title').show();
        },
        //Save edited title
        updateRecipeTitle: function() {
            this.$('.input-edit-recipe-title').hide();
            this.$('h2.recipe-title').show();
            this.$('.btn-edit-recipe-title').show();
            this.$('.btn-update-recipe-title').hide();
            this.$('.btn-cancel-recipe-title').hide();
            var id = this.model.get('id');
            var name = this.$('.input-edit-recipe-title').val();
            this.model.set("name", name);
        },
        // Cancel editing of title
        cancelRecipeTitle: function( ) {
            this.$('.input-edit-recipe-title').hide();
            this.$('.recipe-title').show();
            this.$('.btn-edit-recipe-title').show();
            this.$('.btn-update-recipe-title').hide();
            this.$('.btn-cancel-recipe-title').hide();
            this.$el.find('.input-edit-recipe-title').val('');
        },
        // Add new ingredient
        addIngredient: function() {

            this.$('.select-ingredients').hide();
            this.$('.btn-add-ingredient').hide();
            this.$('.btn-update-add-ingredient').show();
            this.$('.btn-cancel-add-ingredient').show();
        },
        // Save newly added ingredient
        updateAddIngredient: function() {
            this.$('.btn-add-ingredient').show();
            this.$('.btn-update-add-ingredient').hide();
            this.$('.btn-cancel-add-ingredient').hide();
            count = ingredientsCollection.length + 1;
            ingredientInput = this.$('.select-ingredients').val();
            var addedIngredient = _.map(ingredientInput, function(value) {
                return {id:value, name:ingredientsCollection.get(value).get('name')}
            });
            var ingredients = new Backbone.Collection(addedIngredient);
            recipesCollection.add({
                id: count,
                course: "",
                name: name,
                ingredients: ingredients
            });
        },
        // Cancel addition of new ingredient
        cancelAddIngredient: function() {
            this.$('.btn-add-ingredient').show();
            this.$('.btn-update-add-ingredient').hide();
            this.$('.btn-cancel-add-ingredient').hide();
        },
        //Delete Ingredient
        deleteIngredient: function() {
            this.$('.btn-delete-ingredient').show();
        }
    });

    // Search Results view
    // ===================

    Recipe.Views.Results = Backbone.View.extend({
        template: Recipe.Templates.results,
        tagName: "ul",
        initialize: function () {
            this.allRecipes = this.collection;
            this.collection.on('all', this.render, this);
            this.listenTo(Backbone, 'Recipe:search', this.search);
        },
        events: {
            'click .btn-add-recipe': 'addRecipe'
        },
        beforeRender: function () {
            this.collection.each(function (model) {
                this.addView(model, true)
            }, this)
        },
        addView: function (model, render) {
            var view = this.insertView('ul', new Recipe.Views.Recipes({ model: model }));
// ??? This never ever happens?!
            if (render !== false) {
                view.render();
            }
        },
        search: function (ingredients) {
//              this.$el.find('.select-ingredients').val('');
            this.removeView('ul');
            if (ingredients.length == 0) {
                this.collection = this.allRecipes;
// ??? "this.beforeRender()" and "this.renderViews('ul')" happen in both the if and the else?
                this.beforeRender();
                this.renderViews('ul');
            }
            else {
                var results = [];
                recipesCollection.each(function (recipe) {
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

    // Main view
    // =========

    Recipe.Views.Main = Backbone.View.extend({
        template: "#main-template",
        events: {
            'click #header': 'home'
        },
        home: function () {
            router.navigate("", { trigger: true});
        }
    });

    // ======
    // Router
    // ======

    var Workspace = Backbone.Router.extend({
        initialize: function(options) {
            this.el = options.el
        },
        routes: {
            "recipe/:id": "recipe",
            "*path": "mainLayout"
        },
        mainLayout: function () {
            app.setView('#content-container', new Recipe.Views.MainLayout());
            app.renderViews('#content-container');
        },
        recipe: function (id) {
            var recipes = recipesCollection.get(id);
            var recipeView = new Recipe.Views.SingleRecipe({ model: recipes });
            app.setView('#content-container', recipeView);
            app.renderViews('#content-container');
        }
    });

    // ===========
    //Main program
    // ===========

    var main = $('#main');
    var router = new Workspace({el: main});
    // Init stuff
    var app = new Recipe.Views.Main();
    app.render();
    main.append(app.$el);
    Backbone.history.start({pushState: false});
});