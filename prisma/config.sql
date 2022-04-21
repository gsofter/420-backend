/* Create database */
drop database if exists l420backend;
create database l420backend;

/* Create user with password */
create user lldevs with encrypted password 'look-labs';

/* Grant privileges and rights */
grant all privileges on database l420backend to lldevs;
alter user lldevs createdb;
