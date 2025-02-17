/*
 * Copyright 2024 Datastrato Pvt Ltd.
 * This software is licensed under the Apache License version 2.
 */
package com.datastrato.gravitino.integration.test.web.ui.utils;

import java.util.concurrent.TimeUnit;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// WebDriverManager manage the multiple web drivers to run the WEB UI tests.
public class WebDriverManager {
  public static final Logger LOG = LoggerFactory.getLogger(WebDriverManager.class);

  public static WebDriver getWebDriver(int port) {
    String url = String.format("http://127.0.0.1:%d", port);

    WebDriverProvider provide = new ChromeWebDriverProvider();
    WebDriver driver = generateWebDriver(provide);
    driver.manage().timeouts().implicitlyWait(AbstractWebIT.MAX_IMPLICIT_WAIT, TimeUnit.SECONDS);
    driver.get(url);

    // wait for webpage load compiled.
    long start = System.currentTimeMillis();
    boolean loaded = false;
    while (System.currentTimeMillis() - start < 60 * 1000) {
      try {
        (new WebDriverWait(driver, 10))
            .until(
                new ExpectedCondition<Boolean>() {
                  @Override
                  public Boolean apply(WebDriver d) {
                    String gravitinoVersion = d.findElement(By.id("gravitino_version")).getText();
                    String projectVersion = System.getenv("PROJECT_VERSION");
                    return projectVersion.equalsIgnoreCase(gravitinoVersion);
                  }
                });
        loaded = true;
        break;
      } catch (TimeoutException e) {
        LOG.info("Exception in WebDriverManager while WebDriverWait ", e);
        driver.navigate().to(url);
      }
    }

    if (!loaded) {
      throw new RuntimeException("Webpage not loaded in 60 seconds.");
    }
    Dimension d = new Dimension(1440, 1080);
    driver.manage().window().setSize(d);

    return driver;
  }

  private static WebDriver generateWebDriver(WebDriverProvider provide) {
    provide.downloadWebDriver();
    WebDriver driver = provide.createWebDriver();
    return driver;
  }
}
