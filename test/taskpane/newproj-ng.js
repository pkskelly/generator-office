/* jshint expr:true */
'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var mockery = require('mockery');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

var Xml2Js = require('xml2js');
var validator = require('validator');
var chai = require('chai'),
  expect = chai.expect;

var util = require('./../_testUtils');


// sub:generator options
var options = {};


/* +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ */

describe('office:taskpane', function(){

  var projectDisplayName = 'My Office Add-in';
  var projectEscapedName = 'my-office-add-in';
  var manifestFileName = 'manifest-' + projectEscapedName + '.xml';

  beforeEach(function(done){
    options = {
      name: 'My Office Add-in'
    };
    done();
  });

  /**
   * Test scrubbing of name with illegal characters
   */
  it('project name is alphanumeric only', function(done){
    options = {
      name: 'Some\'s bad * character$ ~!@#$%^&*()',
      rootPath: '',
      tech: 'ng',
      startPage: 'https://localhost:8443/manifest-only/index.html'
    };

    // run generator
    helpers.run(path.join(__dirname, '../../generators/taskpane'))
      .withOptions(options)
      .on('end', function(){
        var expected = {
          name: 'somes-bad-character',
          version: '0.1.0',
          devDependencies: {
            chalk: '^1.1.1',
            gulp: '^3.9.0',
            'gulp-load-plugins': '^1.0.0',
            'gulp-task-listing': '^1.0.1',
            'gulp-webserver': '^0.9.1',
            minimist: '^1.2.0',
            xmllint: 'git+https://github.com/kripken/xml.js.git'
          }
        };

        assert.file('package.json');
        util.assertJSONFileContains('package.json', expected);

        done();
      });
  });

  /**
   * Test addin when running on empty folder.
   */
  describe('run on new project (empty folder)', function(){

    beforeEach(function(done){
      // set to current folder
      options.rootPath = '';
      done();
    });

    /**
     * Test addin when technology = angular
     */
    describe('addin technology:ng', function(){

      beforeEach(function(done){
        // set language to html
        options.tech = 'ng';

        // set products
        options.clients = ['Document', 'Workbook', 'Presentation', 'Project'];

        // run the generator
        helpers.run(path.join(__dirname, '../../generators/taskpane'))
          .withOptions(options)
          .on('end', done);
      });

      afterEach(function(){
        mockery.disable();
      });

      /**
       * All expected files are created.
       */
      it('creates expected files', function(done){
        var expected = [
          '.bowerrc',
          'bower.json',
          'package.json',
          'gulpfile.js',
          manifestFileName,
          'manifest.xsd',
          'tsd.json',
          'jsconfig.json',
          'tsconfig.json',
          'index.html',
          'app/app.module.js',
          'app/app.routes.js',
          'app/home/home.controller.js',
          'app/home/home.html',
          'app/services/data.service.js',
          'content/Office.css',
          'images/close.png',
          'scripts/MicrosoftAjax.js'
        ];
        assert.file(expected);
        done();
      });

      /**
       * bower.json is good
       */
      it('bower.json contains correct values', function(done){
        var expected = {
          name: projectEscapedName,
          version: '0.1.0',
          dependencies: {
            'microsoft.office.js': '*',
            angular: '~1.4.4',
            'angular-route': '~1.4.4',
            'angular-sanitize': '~1.4.4',
            'office-ui-fabric': '*'
          }
        };

        assert.file('bower.json');
        util.assertJSONFileContains('bower.json', expected);
        done();
      });

      /**
       * package.json is good
       */
      it('package.json contains correct values', function(done){
        var expected = {
          name: projectEscapedName,
          version: '0.1.0',
          scripts: {
            postinstall: 'bower install'
          },
          devDependencies: {
            chalk: '^1.1.1',
            gulp: '^3.9.0',
            'gulp-load-plugins': '^1.0.0',
            'gulp-task-listing': '^1.0.1',
            'gulp-webserver': '^0.9.1',
            minimist: '^1.2.0',
            xmllint: 'git+https://github.com/kripken/xml.js.git'
          }
        };

        assert.file('package.json');
        util.assertJSONFileContains('package.json', expected);
        done();
      });

      /**
       * manfiest-*.xml is good
       */
      describe('manifest-*.xml contents', function(){
        var manifest = {};

        beforeEach(function(done){
          var parser = new Xml2Js.Parser();
          fs.readFile(manifestFileName, 'utf8', function(err, manifestContent){
            parser.parseString(manifestContent, function(err, manifestJson){
              manifest = manifestJson;

              done();
            });
          });
        });

        it('has valid ID', function(done){
          expect(validator.isUUID(manifest.OfficeApp.Id)).to.be.true;
          done();
        });

        it('has correct display name', function(done){
          expect(manifest.OfficeApp.DisplayName[0].$.DefaultValue).to.equal('My Office Add-in');
          done();
        });

        it('has correct start page', function(done){
          var subject = manifest.OfficeApp.DefaultSettings[0].SourceLocation[0].$.DefaultValue;
          expect(subject).to.equal('https://localhost:8443/index.html');
          done();
        });

        /**
      * Word present in host entry.
      */
        it('includes Word in Hosts', function(done){
          var found = false;
          _.forEach(manifest.OfficeApp.Hosts[0].Host, function(h){
            if (h.$.Name === 'Document') {
              found = true;
            }
          });
          expect(found, '<Host Name="Document"/> exist').to.be.true;

          done();
        });

        /**
         * Excel present in host entry.
         */
        it('includes Excel in Hosts', function(done){
          var found = false;
          _.forEach(manifest.OfficeApp.Hosts[0].Host, function(h){
            if (h.$.Name === 'Workbook') {
              found = true;
            }
          });
          expect(found, '<Host Name="Workbook"/> exist').to.be.true;

          done();
        });

        /**
         * PowerPoint present in host entry.
         */
        it('includes PowerPoint in Hosts', function(done){
          var found = false;
          _.forEach(manifest.OfficeApp.Hosts[0].Host, function(h){
            if (h.$.Name === 'Presentation') {
              found = true;
            }
          });
          expect(found, '<Host Name="Presentation"/> exist').to.be.true;

          done();
        });

        /**
         * Project present in host entry.
         */
        it('includes Project in Hosts', function(done){
          var found = false;
          _.forEach(manifest.OfficeApp.Hosts[0].Host, function(h){
            if (h.$.Name === 'Project') {
              found = true;
            }
          });
          expect(found, '<Host Name="Project"/> exist').to.be.true;

          done();
        });

      }); // describe('manifest-*.xml contents')

      /**
       * tsd.json is good
       */
      describe('tsd.json contents', function(){
        var tsd = {};

        beforeEach(function(done){
          fs.readFile('tsd.json', 'utf8', function(err, tsdJson){
            tsd = JSON.parse(tsdJson);

            done();
          });
        });

        it('has correct *.d.ts references', function(done){
          expect(tsd.installed).to.exist;
          expect(tsd.installed['angularjs/angular.d.ts']).to.exist;
          expect(tsd.installed['angularjs/angular-route.d.ts']).to.exist;
          expect(tsd.installed['angularjs/angular-sanitize.d.ts']).to.exist;
          expect(tsd.installed['office-js/office-js.d.ts']).to.exist;
          done();
        });

      }); // describe('tsd.json contents')

      /**
       * gulpfile.js is good
       */
      describe('gulpfule.js contents', function(){
        
        it('contains task \'help\'', function(done){
          assert.file('gulpfile.js');
          assert.fileContent('gulpfile.js', 'gulp.task(\'help\',');
          done();
        });
        
        it('contains task \'default\'', function(done){
          assert.file('gulpfile.js');
          assert.fileContent('gulpfile.js', 'gulp.task(\'default\',');
          done();
        });

        it('contains task \'serve-static\'', function(done){

          assert.file('gulpfile.js');
          assert.fileContent('gulpfile.js', 'gulp.task(\'serve-static\',');
          done();
        });
        
        it('contains task \'validate-xml\'', function(done){
          assert.file('gulpfile.js');
          assert.fileContent('gulpfile.js', 'gulp.task(\'validate-xml\',');
          done();
        });

      }); // describe('gulpfile.js contents')

    }); // describe('technology:ng')

  }); // describe('run on new project (empty folder)')

});
