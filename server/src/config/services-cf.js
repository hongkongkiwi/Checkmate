import ServiceRegistry from "../service/system/serviceRegistry.js";
import TranslationService from "../service/system/translationService.js";
import StringService from "../service/system/stringService.js";
import NetworkService from "../service/infrastructure/networkService.js";
import EmailService from "../service/infrastructure/emailService.js";
import BufferService from "../service/infrastructure/bufferService.js";
import StatusService from "../service/infrastructure/statusService.js";
import NotificationUtils from "../service/infrastructure/notificationUtils.js";
import NotificationService from "../service/infrastructure/notificationService.js";
import ErrorService from "../service/infrastructure/errorService.js";
import UserService from "../service/business/userService.js";
import CheckService from "../service/business/checkService.js";
import DiagnosticService from "../service/business/diagnosticService.js";
import InviteService from "../service/business/inviteService.js";
import MaintenanceWindowService from "../service/business/maintenanceWindowService.js";
import MonitorService from "../service/business/monitorService.js";
import papaparse from "papaparse";
import axios from "axios";
import got from "got";
import ping from "ping";
import http from "http";
import https from "https";
import Docker from "dockerode";
import net from "net";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import pkg from "handlebars";
const { compile } = pkg;
import mjml2html from "mjml";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { games } from "gamedig";
import jmespath from "jmespath";
import { GameDig } from "gamedig";

import { fileURLToPath } from "url";

// Cloudflare-specific database service
import CFDatabase from "../db/cf/CFDatabase.js";

// Cloudflare-specific modules
import UserModule from "../db/cf/modules/userModule.js";
import MonitorModule from "../db/cf/modules/monitorModule.js";
import CheckModule from "../db/cf/modules/checkModule.js";
import TeamModule from "../db/cf/modules/teamModule.js";
import NotificationModule from "../db/cf/modules/notificationModule.js";
import InviteModule from "../db/cf/modules/inviteModule.js";
import MaintenanceWindowModule from "../db/cf/modules/maintenanceWindowModule.js";
import StatusPageModule from "../db/cf/modules/statusPageModule.js";
import RecoveryModule from "../db/cf/modules/recoveryModule.js";
import SettingsModule from "../db/cf/modules/settingsModule.js";
import AnnouncementModule from "../db/cf/modules/announcementModule.js";

export const initializeServices = async ({ logger, envSettings, settingsService, d1, kv, r2, sentry }) => {
  const serviceRegistry = new ServiceRegistry({ logger });
  ServiceRegistry.instance = serviceRegistry;

  const translationService = new TranslationService(logger);
  await translationService.initialize();

  const stringService = new StringService(translationService);

  // Create Cloudflare DB Modules
  const userModule = new UserModule({ logger, d1 });
  const monitorModule = new MonitorModule({ logger, d1 });
  const checkModule = new CheckModule({ logger, d1 });
  const teamModule = new TeamModule({ logger, d1 });
  const notificationModule = new NotificationModule({ logger, d1 });
  const inviteModule = new InviteModule({ logger, d1 });
  const maintenanceWindowModule = new MaintenanceWindowModule({ logger, d1 });
  const statusPageModule = new StatusPageModule({ logger, d1 });
  const recoveryModule = new RecoveryModule({ d1, crypto, stringService, logger });
  const settingsModule = new SettingsModule({ d1, logger, crypto });
  const announcementModule = new AnnouncementModule({ d1, logger });

  // Create Cloudflare Database
  const db = new CFDatabase({
    logger,
    envSettings,
    d1,
    kv,
    r2,
    userModule,
    monitorModule,
    checkModule,
    teamModule,
    notificationModule,
    inviteModule,
    maintenanceWindowModule,
    statusPageModule,
    recoveryModule,
    settingsModule,
    announcementModule,
    sentry,
  });

  // Connect to database
  await db.connect();

  const networkService = new NetworkService({
    axios,
    got,
    https,
    jmespath,
    GameDig,
    ping,
    logger,
    http,
    Docker,
    net,
    stringService,
    settingsService,
  });
  
  const emailService = new EmailService(settingsService, fs, path, compile, mjml2html, nodemailer, logger);
  const bufferService = new BufferService({ db, logger, envSettings });
  const statusService = new StatusService({ db, logger, buffer: bufferService });

  const notificationUtils = new NotificationUtils({
    stringService,
    emailService,
  });

  const notificationService = new NotificationService({
    emailService,
    db,
    logger,
    networkService,
    stringService,
    notificationUtils,
  });

  const errorService = new ErrorService();

  // For Cloudflare, we'll use a simplified queue system
  const jobQueue = {
    async addJob(job) {
      // In a real implementation, this would add a job to a queue
      // For now, we'll just log it
      logger.info({
        message: "Job added to queue",
        service: "JobQueue",
        job,
      });
      return { id: "job-" + Date.now() };
    },
    
    async processJob(jobId) {
      // In a real implementation, this would process a job from the queue
      // For now, we'll just log it
      logger.info({
        message: "Processing job",
        service: "JobQueue",
        jobId,
      });
      return { success: true };
    }
  };

  // Business services
  const userService = new UserService({
    crypto,
    db,
    emailService,
    settingsService,
    logger,
    stringService,
    jwt,
    errorService,
    jobQueue,
  });
  
  const checkService = new CheckService({
    db,
    settingsService,
    stringService,
    errorService,
  });
  
  const diagnosticService = new DiagnosticService();
  
  const inviteService = new InviteService({
    db,
    settingsService,
    emailService,
    stringService,
    errorService,
  });
  
  const maintenanceWindowService = new MaintenanceWindowService({
    db,
    settingsService,
    stringService,
    errorService,
  });
  
  const monitorService = new MonitorService({
    db,
    settingsService,
    jobQueue,
    stringService,
    emailService,
    papaparse,
    logger,
    errorService,
    games,
  });

  const services = {
    settingsService,
    translationService,
    stringService,
    db,
    networkService,
    emailService,
    bufferService,
    statusService,
    notificationService,
    jobQueue,
    userService,
    checkService,
    diagnosticService,
    inviteService,
    maintenanceWindowService,
    monitorService,
    errorService,
    logger,
  };

  Object.values(services).forEach((service) => {
    if (service.serviceName) {
      ServiceRegistry.register(service.serviceName, service);
    }
  });

  return services;
};