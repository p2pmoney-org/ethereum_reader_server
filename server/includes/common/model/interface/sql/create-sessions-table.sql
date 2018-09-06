CREATE TABLE IF NOT EXISTS `webapp`.`webapp_sessions` (
  `SessionId` int(11) NOT NULL AUTO_INCREMENT,
  `SessionUUID` varchar(36) NOT NULL,
  `UserId` int(11) NOT NULL,
  `CreatedOn` datetime NOT NULL,
  `LastPingOn` datetime NOT NULL,
  `IsAuthenticated` int(11) NOT NULL,
  `SessionVariables` longblob COMMENT 'Serialized content of Session variables array',
  PRIMARY KEY (`SessionId`),
  UNIQUE KEY `SessionUUID` (`SessionUUID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
