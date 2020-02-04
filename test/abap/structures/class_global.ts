import {structureType} from "../_utils";
import {ClassGlobal} from "../../../src/abap/structures";

const cases = [
  {abap: "CLASS zfoo DEFINITION. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},
  {abap: "CLASS zfoo DEFINITION. PUBLIC SECTION. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},
  {abap: "CLASS zfoo DEFINITION. PROTECTED SECTION. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},
  {abap: "CLASS zfoo DEFINITION. PRIVATE SECTION. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},
  {abap: "CLASS zfoo DEFINITION PUBLIC CREATE PUBLIC. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},
  {abap: "CLASS zfoo DEFINITION. PUBLIC SECTION. METHODS method1. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},
  {abap: "CLASS zfoo DEFINITION. PUBLIC SECTION. METHODS method1. PRIVATE SECTION. ENDCLASS. CLASS zfoo IMPLEMENTATION. ENDCLASS."},

  {abap: "CLASS zcl_foobar DEFINITION PUBLIC CREATE PUBLIC.\n" +
  "  PUBLIC SECTION.\n" +
  "  PROTECTED SECTION.\n" +
  "  PRIVATE SECTION.\n" +
  "    METHODS method1.\n" +
  "ENDCLASS.\n" +
  "CLASS zcl_foobar IMPLEMENTATION.\n" +
  "  METHOD method1.\n" +
  "  ENDMETHOD.\n" +
  "ENDCLASS."},
];

structureType(cases, new ClassGlobal());