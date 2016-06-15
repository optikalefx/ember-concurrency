import Ember from 'ember';

export function isGeneratorIterator(iter) {
  return (iter &&
          typeof iter.next      === 'function' &&
          typeof iter['return'] === 'function' &&
          typeof iter['throw']  === 'function');
}

export function Arguments(args, defer) {
  this.args = args;
  this.defer = defer;
}

Arguments.prototype.resolve = function(value) {
  if (this.defer) {
    this.defer.resolve(value);
  }
};

export function objectAssign(target) {
  'use strict';
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  target = Object(target);
  for (var index = 1; index < arguments.length; index++) {
    var source = arguments[index];
    if (source != null) {
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
  }
  return target;
}

export function createObservable(fn) {
  return {
    subscribe(onNext, onError, onCompleted) {
      let isDisposed = false;
      let isComplete = false;
      let publish = (v) => {
        if (isDisposed || isComplete) { return; }
        joinAndSchedule(null, onNext, v);
      };
      publish.error = (e) => {
        if (isDisposed || isComplete) { return; }
        joinAndSchedule(() => {
          if (onError) { onError(e); }
          if (onCompleted) { onCompleted(); }
        });
      };
      publish.complete = () => {
        if (isDisposed || isComplete) { return; }
        isComplete = true;
        joinAndSchedule(() => {
          if (onCompleted) { onCompleted(); }
        });
      };

      // TODO: publish.complete?

      let maybeDisposer = fn(publish);
      let disposer = typeof maybeDisposer === 'function' ? maybeDisposer : Ember.K;

      return {
        dispose() {
          if (isDisposed) { return; }
          isDisposed = true;
          disposer();
        },
      };
    },
  };
}

function joinAndSchedule(...args) {
  Ember.run.join(() => {
    Ember.run.schedule('actions', ...args);
  });
}

export function _cleanupOnDestroy(owner, object, cleanupMethodName) {
  // TODO: find a non-mutate-y, hacky way of doing this.
  if (!owner.willDestroy.__ember_processes_destroyers__) {
    let oldWillDestroy = owner.willDestroy;
    let disposers = [];

    owner.willDestroy = function() {
      for (let i = 0, l = disposers.length; i < l; i ++) {
        disposers[i]();
      }
      oldWillDestroy.apply(owner, arguments);
    };
    owner.willDestroy.__ember_processes_destroyers__ = disposers;
  }

  owner.willDestroy.__ember_processes_destroyers__.push(() => {
    object[cleanupMethodName]();
  });
}

export let INVOKE = "__invoke_symbol__";
try { INVOKE = Ember.__loader.require('ember-routing-htmlbars/keywords/closure-action')['INVOKE'] || INVOKE; } catch(e) {}
try { INVOKE = Ember.__loader.require('ember-routing/keywords/closure-action')['INVOKE'] || INVOKE; } catch(e) {}

// TODO: Symbol polyfill?
export const yieldableSymbol = "__ec_yieldable__";

export const _ComputedProperty = Ember.__loader.require("ember-metal/computed").ComputedProperty;

